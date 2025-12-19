
import { PathRequest, Point, VersionInfo, DebugRect } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector } from '../geometry';
import { findBiDirectionalAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';
import { calculateEnhancedFreeSpace, isAdjacent } from './v1.4.4.1';
import { GRID_SIZE, CANVAS_SIZE } from '../../../constants';

export const V1_5_METADATA: VersionInfo = {
  id: 'v1.5',
  version: '1.5',
  title: 'Graph-Accelerated Bi-Directional',
  date: 'Stable',
  description: `
### 1. High-Performance Routing
**v1.5** fundamentally changes the search strategy from "Blind Grid Search" to "Hierarchical Graph Search". It utilizes the **Maximal Empty Rectangle (MER)** graph to intelligently guide the pathfinding process.

### 2. Multi-Stage Relaxation (Hybrid)
To ensure connectivity even in tight spaces (like the DRAM-CPU bus), this version combines the speed of Graph Search with the robustness of Iterative Relaxation.

**The Strategy Loop:**
1.  **Corridor Search**: First, attempt to route strictly inside the empty-space corridor found by the graph.
2.  **Relaxation**: If strict routing fails, progressively reduce safety buffers (from 1 to 0) and finally allow overlap if absolutely necessary.
3.  **Global Fallback**: If the Corridor itself is flawed (e.g., topologically valid but geometrically blocked), the engine "breaks out" of the corridor and performs a global grid search.

### 3. Dynamic Cost Weighting
Occupied regions are no longer binary (Blocked/Unblocked). The graph now calculates **Density Cost**:
$$Cost_{node} = Dist + BasePenalty + (Density \\times Scale)$$
A large rectangle with a single wire is now preferred over a small, crowded passage.

### 4. Bi-Directional Search
Utilizes **Bi-Directional A*** in all grid phases to halve the effective search depth.
`
};

// Simple Graph Node for Coarse A*
interface GraphNode {
    id: string; // Index in rects array
    rect: DebugRect;
    g: number;
    h: number;
    f: number;
    parent: GraphNode | null;
}

export const routeWireV1_5 = (request: PathRequest): Point[] => {
  const { start, startDirection, end, endDirection, obstacles, existingWires } = request;
  
  const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
  const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };

  const startDirVec = getDirectionVector(startDirection);
  const endDirVec = getDirectionVector(endDirection);
  
  const startStub = { x: startGrid.x + startDirVec.x, y: startGrid.y + startDirVec.y };
  const endStub = { x: endGrid.x + endDirVec.x, y: endGrid.y + endDirVec.y };

  // 1. Generate Free Space Graph (MERs)
  const rects = calculateEnhancedFreeSpace(obstacles, existingWires);

  // 2. Identify Start and End Rectangles
  const findRectForPoint = (p: Point) => rects.find(r => 
      p.x >= r.x && p.x <= r.x + r.width && 
      p.y >= r.y && p.y <= r.y + r.height
  );

  const startRect = findRectForPoint(startStub);
  const endRect = findRectForPoint(endStub);

  // Define Routing Stages (Relaxation)
  const stages = [
      { name: 'Strict', buffer: 1, allowCollinear: false },
      { name: 'Soft', buffer: 0, allowCollinear: false },
      // { name: 'Overlap', buffer: 0, allowCollinear: true } // Disabled
  ];

  // 3. Attempt 1: Corridor-Based Search
  // If we can find a graph path, we try to route inside that corridor first.
  if (startRect && endRect) {
      const corridorRects = findCoarsePath(rects, startRect, endRect);
      
      if (corridorRects.length > 0) {
          // Build Mask
          const allowedNodes = new Set<string>();
          corridorRects.forEach(r => {
              // Expand slightly (buffer) to ensure connectivity at edges
              for(let x = r.x; x <= r.x + r.width; x++) {
                  for(let y = r.y; y <= r.y + r.height; y++) {
                      allowedNodes.add(getKey(x, y));
                  }
              }
          });
          // Allow terminals
          [startGrid, startStub, endGrid, endStub].forEach(p => allowedNodes.add(getKey(p.x, p.y)));

          // Run Stages within Corridor
          for (const stage of stages) {
              const path = runStandardBiDirectional(request, allowedNodes, stage.buffer, stage.allowCollinear);
              if (path.length > 0) return path;
          }
      }
  }

  // 4. Attempt 2: Global Fallback
  // If corridor search failed (or start/end not in rects), try global search with relaxation.
  // This handles cases where the graph topology didn't match geometric reality.
  for (const stage of stages) {
      const path = runStandardBiDirectional(request, null, stage.buffer, stage.allowCollinear);
      if (path.length > 0) return path;
  }

  return [];
};

// Helper: Run the Grid Search (Bi-Directional)
const runStandardBiDirectional = (
    request: PathRequest, 
    allowedNodes: Set<string> | null,
    buffer: number,
    allowCollinear: boolean
): Point[] => {
    const { start, startDirection, end, endDirection, obstacles, existingWires } = request;
    const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
    const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };
    const startDirVec = getDirectionVector(startDirection);
    const endDirVec = getDirectionVector(endDirection);
    const startStub = { x: startGrid.x + startDirVec.x, y: startGrid.y + startDirVec.y };
    const endStub = { x: endGrid.x + endDirVec.x, y: endGrid.y + endDirVec.y };

    const { costMap, wireOccupancy } = generateMaps(obstacles, existingWires, buffer);

    // Unblock terminals
    [startGrid, startStub, endGrid, endStub].forEach(p => costMap.delete(getKey(p.x, p.y)));

    const pathGrid = findBiDirectionalAStarPath(
        startStub,
        endStub,
        costMap,
        wireOccupancy,
        allowedNodes,
        { allowCollinear }
    );

    if (pathGrid.length === 0) return [];

    const fullPathGrid = [startGrid, ...pathGrid, endGrid];
    const fullPathPixels = fullPathGrid.map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));
    
    return simplifyPath(fullPathPixels);
};

// Helper: Coarse A* on Rectangles
const findCoarsePath = (allRects: DebugRect[], startRect: DebugRect, endRect: DebugRect): DebugRect[] => {
    // Build Adjacency Map
    const adj = new Map<string, DebugRect[]>();
    allRects.forEach((r, i) => {
        const neighbors: DebugRect[] = [];
        allRects.forEach((other, j) => {
            if (i !== j && isAdjacent({x:r.x, y:r.y, w:r.width, h:r.height}, {x:other.x, y:other.y, w:other.width, h:other.height})) {
                neighbors.push(other);
            }
        });
        adj.set(r.id, neighbors);
    });

    const openSet: GraphNode[] = [];
    const closedSet = new Set<string>();

    const getCenter = (r: DebugRect) => ({ x: r.x + r.width/2, y: r.y + r.height/2 });
    const dist = (r1: DebugRect, r2: DebugRect) => {
        const c1 = getCenter(r1);
        const c2 = getCenter(r2);
        return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
    };

    openSet.push({
        id: startRect.id,
        rect: startRect,
        g: 0,
        h: dist(startRect, endRect),
        f: dist(startRect, endRect),
        parent: null
    });

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift()!;

        if (current.id === endRect.id) {
            const path: DebugRect[] = [];
            let temp: GraphNode | null = current;
            while(temp) {
                path.push(temp.rect);
                temp = temp.parent;
            }
            return path.reverse();
        }

        closedSet.add(current.id);

        const neighbors = adj.get(current.id) || [];
        for (const neighbor of neighbors) {
            if (closedSet.has(neighbor.id)) continue;

            let cost = dist(current.rect, neighbor);
            
            // Dynamic Density Cost
            if (neighbor.hasWire) {
                const totalSubs = neighbor.subSquares?.length || 1;
                const activeSubs = neighbor.subSquares?.filter(s => s.hasWire).length || 0;
                const density = activeSubs / totalSubs;
                
                // Base 30 penalty + up to 100 based on density
                // "Not too much, not too less" - allows traversal if necessary, but avoids heavy traffic
                cost += 30 + (density * 100); 
            }

            const g = current.g + cost;
            const h = dist(neighbor, endRect);
            
            const existing = openSet.find(n => n.id === neighbor.id);
            if (!existing || g < existing.g) {
                if (existing) {
                    existing.g = g;
                    existing.f = g + h;
                    existing.parent = current;
                } else {
                    openSet.push({
                        id: neighbor.id,
                        rect: neighbor,
                        g, h, f: g + h,
                        parent: current
                    });
                }
            }
        }
    }

    return [];
};
