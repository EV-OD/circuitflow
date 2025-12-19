
import { PathRequest, Point, VersionInfo, DebugRect } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector } from '../geometry';
import { findBiDirectionalAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';
import { calculateEnhancedFreeSpace, isAdjacent } from './v1.4.4.1';

export const V1_5_1_METADATA: VersionInfo = {
  id: 'v1.5.1',
  version: '1.5.1',
  title: 'Multi-Path Topological Retry',
  date: 'Latest',
  description: `
### 1. The "Last Resort" Philosophy
Wire overlapping is strictly forbidden unless absolutely no other topological path exists. **v1.5.1** introduces a **Corridor Retry Loop** to exhaust all possible "clean" routes before enabling relaxation rules.

### 2. Multi-Path Graph Search
If the initial corridor found by the graph search is blocked at the grid level (e.g., by existing wires or tight bottlenecks):
1.  The engine identifies the path as "failed strict routing".
2.  It applies a temporary **Fatigue Penalty** to all regions in that corridor.
3.  It re-runs the graph search to find an **Alternative Corridor**.
4.  It repeats this process up to 3 times to discover detours.

### 3. Priority Pipeline
1.  **Corridor A (Strict)**: Try primary topological route.
2.  **Corridor B (Strict)**: Try alternative topological route.
3.  **Corridor C (Strict)**: Try tertiary route.
4.  **Global (Strict)**: Break out of corridors, try full board search.
5.  **Global (Soft)**: Remove buffers (allow hugging).
6.  **Global (Overlap)**: Only now, allow wire crossing.

### 4. Graph Cost Tuning
Refined density calculations to better estimate passability of partially occupied regions.
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

export const routeWireV1_5_1 = (request: PathRequest): Point[] => {
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

  // 3. Phase 1: Corridor Iteration (Strict Rules Only)
  // We try up to 3 different topological paths before we even think about relaxing rules.
  
  const penalties = new Map<string, number>();
  const MAX_CORRIDOR_ATTEMPTS = 3;
  
  if (startRect && endRect) {
      for(let i=0; i<MAX_CORRIDOR_ATTEMPTS; i++) {
          const corridorRects = findCoarsePath(rects, startRect, endRect, penalties);
          
          if (corridorRects.length === 0) break; // No path possible in graph

          // Build Mask from Corridor
          const allowedNodes = new Set<string>();
          corridorRects.forEach(r => {
              // Expand buffer to allow connectivity
               for(let x = r.x; x <= r.x + r.width; x++) {
                  for(let y = r.y; y <= r.y + r.height; y++) {
                      allowedNodes.add(getKey(x, y));
                  }
               }
          });
          [startGrid, startStub, endGrid, endStub].forEach(p => allowedNodes.add(getKey(p.x, p.y)));

          // Attempt Strict Grid Search (Buffer 1, No Overlap)
          const path = runStandardBiDirectional(request, allowedNodes, 1, false);
          if (path.length > 0) return path;

          // Failure: Penalize this corridor to force a detour in the next iteration
          corridorRects.forEach(r => {
              // Don't penalize start/end nodes heavily, we need them
              if (r.id !== startRect.id && r.id !== endRect.id) {
                  const currentP = penalties.get(r.id) || 0;
                  // Add substantial penalty so the graph router chooses a different path
                  penalties.set(r.id, currentP + 500); 
              }
          });
      }
  }

  // 4. Phase 2: Global Strict
  // If no specific corridor worked, try strict routing on the whole board. 
  // Maybe the graph topology was misleading (e.g. valid path exists through a "blocked" rect via a gap).
  const globalStrict = runStandardBiDirectional(request, null, 1, false);
  if (globalStrict.length > 0) return globalStrict;

  // 5. Phase 3: Global Soft (Relax Buffer)
  // Start hugging walls.
  const globalSoft = runStandardBiDirectional(request, null, 0, false);
  if (globalSoft.length > 0) return globalSoft;

  // 6. Phase 4: Global Overlap (Last of Last Resort)
  // Allow crossing other wires.
  // const globalOverlap = runStandardBiDirectional(request, null, 0, true);
  // return globalOverlap;
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
const findCoarsePath = (
    allRects: DebugRect[], 
    startRect: DebugRect, 
    endRect: DebugRect, 
    penalties: Map<string, number>
): DebugRect[] => {
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
                // Base cost + density impact
                cost += 30 + (density * 100); 
            }

            // Apply Fatigue Penalty (from previous failed attempts)
            cost += (penalties.get(neighbor.id) || 0);

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
