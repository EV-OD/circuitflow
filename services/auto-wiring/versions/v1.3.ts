
import { PathRequest, Point, VersionInfo, Wire } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector, getClosestPointOnSegment } from '../geometry';
import { findAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';

export const V1_3_METADATA: VersionInfo = {
  id: 'v1.3',
  version: '1.3',
  title: 'Graph-Aware T-Junctions',
  date: 'Latest',
  description: `
### 1. The Steiner Tree Approximation
Standard pathfinding treats every wire as a distinct entity ($A \\to B$). **v1.3** begins treating wires as a connected graph. It implements a heuristic approximation of the **Steiner Tree Problem** (finding the minimum interconnect for a set of points).

### 2. Algorithm: Split-Point Projection
When a user requests a route from **Start** to **End**:

1.  **Net Discovery**: The system queries the graph for all existing segments $S$ connected to **Start**.
2.  **Geometric Projection**: For every segment $s \\in S$, we calculate the closest point $P_{proj}$ on $s$ to the **End** coordinate.
    $$P_{proj} = \\text{clamp}(\\text{project}(End, s))$$
3.  **Distance Heuristic**: We calculate the Manhattan Distance $d = |P_{proj} - End|$.
4.  **Minimization**:
    $$P_{split} = \\underset{P \\in S}{\\arg\\min} (|P - End|)$$
5.  **Rerouting**: If $|P_{split} - End| < |Start - End|$, the routing request is fundamentally altered to begin at $P_{split}$ instead of $Start$.

### 3. Visual Result
This logic produces the classic "T-Junction" found in schematic software. Instead of running two parallel wires from a single pin (which looks amateurish), the second wire branches off the first wire at the point geometrically closest to the destination.

### 4. Limitations
v1.3 allows the split point to be *exactly* on the component pin if that is the mathematically closest point. This can lead to visual ambiguity where a wire appears to exit a pin at a 90-degree angle immediately, obscuring the pin connection point.
`
};

export const routeWireV1_3 = (request: PathRequest): Point[] => {
  const { start, startDirection, end, endDirection, obstacles, existingWires } = request;

  // 1. Identify "The Net" (Existing wires connected to our Source)
  // We want to see if we can branch off an existing wire.
  const sourceNet = existingWires.filter(w => 
    (w.sourceId === request.existingWires[0]?.sourceId /* Hacky check context */) || 
    // Real check: does this wire share the exact same source port?
    // Note: The 'request' object passed doesn't have the raw ID strings easily accessible in existingWires context
    // unless we iterate. 
    // However, looking at the App.tsx loop, 'existingWires' passed to routeWire excludes the one being dragged/created.
    // We need to look at wires that SHARE the start point coordinates.
    (w.points && w.points.length > 0 && Math.abs(w.points[0].x - start.x) < 0.1 && Math.abs(w.points[0].y - start.y) < 0.1)
  );

  const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
  const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };
  const endDirVec = getDirectionVector(endDirection);
  
  // End Stub (Target approach)
  const endStub = {
    x: endGrid.x + endDirVec.x,
    y: endGrid.y + endDirVec.y
  };

  // --- Determine Start Point (T-Junction Logic) ---
  let bestStartGrid = startGrid;
  let bestStartDirVec = getDirectionVector(startDirection);
  let isBranching = false;

  // If we have existing wires on this net, find the best split point
  if (sourceNet.length > 0) {
    let closestDist = Infinity;
    let closestPoint = startGrid;

    // Check every segment of every wire in the net
    sourceNet.forEach(wire => {
      const gridPoints = wire.points.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
      
      for (let i = 0; i < gridPoints.length - 1; i++) {
        const p1 = gridPoints[i];
        const p2 = gridPoints[i+1];
        
        // Find closest point on this segment to the End Goal
        const pt = getClosestPointOnSegment(endGrid, p1, p2);
        const d = Math.abs(pt.x - endGrid.x) + Math.abs(pt.y - endGrid.y);

        if (d < closestDist) {
          closestDist = d;
          closestPoint = pt;
        }
      }
    });

    // If the split point is significantly closer than the original start, use it
    const originalDist = Math.abs(startGrid.x - endGrid.x) + Math.abs(startGrid.y - endGrid.y);
    
    // Threshold: Only branch if it saves us distance or is at least reasonably close
    if (closestDist < originalDist) {
       bestStartGrid = closestPoint;
       // For a T-Junction, we don't have a forced start direction like a Port.
       // We can technically start in any direction perpendicular to the wire, but A* handles this.
       // We pass {0,0} or calculate a heuristic direction towards target.
       bestStartDirVec = { 
         x: Math.sign(endGrid.x - bestStartGrid.x), 
         y: Math.sign(endGrid.y - bestStartGrid.y) 
       };
       // Normalize
       if (bestStartDirVec.x !== 0) bestStartDirVec.y = 0;
       
       isBranching = true;
    }
  }

  // --- Execution ---
  // We reuse v1.2 logic (multi-stage) but with potentially modified start point
  const attempts = [
    { name: "Strict", buffer: 1, allowCollinear: false },
    { name: "Soft Buffer", buffer: 0, allowCollinear: false },
    { name: "Soft Overlap", buffer: 0, allowCollinear: true }
  ];

  let pathGrid: Point[] = [];

  for (const attempt of attempts) {
      const { costMap, wireOccupancy } = generateMaps(obstacles, existingWires, attempt.buffer);

      // Important: Unblock the T-Junction point specifically
      const key = getKey(bestStartGrid.x, bestStartGrid.y);
      costMap.delete(key);
      // If we are branching, we are technically overlapping the existing wire at the start point.
      // We must allow this specific overlap.
      
      // Unblock End
      [endGrid, endStub].forEach(p => costMap.delete(getKey(p.x, p.y)));

      // If not branching, unblock normal start stub
      if (!isBranching) {
        const startDirVec = getDirectionVector(startDirection);
        const startStub = { x: startGrid.x + startDirVec.x, y: startGrid.y + startDirVec.y };
        costMap.delete(getKey(startGrid.x, startGrid.y));
        costMap.delete(getKey(startStub.x, startStub.y));
      }

      pathGrid = findAStarPath(
          bestStartGrid, // Start from the Split Point
          endStub, 
          costMap, 
          wireOccupancy, 
          bestStartDirVec,
          { allowCollinear: attempt.allowCollinear }
      );

      if (pathGrid.length > 0) break; 
  }

  // Fallback
  if (pathGrid.length === 0) {
    // Fallback to simple L-shape from original start if fancy graph routing fails
    const startStub = { x: startGrid.x + getDirectionVector(startDirection).x, y: startGrid.y + getDirectionVector(startDirection).y };
    const midX = Math.floor((startStub.x + endStub.x) / 2);
    pathGrid = [
        startGrid,
        startStub,
        { x: midX, y: startStub.y },
        { x: midX, y: endStub.y },
        endStub
    ];
  }

  const fullPathGrid = [...pathGrid, endGrid];
  
  // If we branched, ensure the start point is exactly the split point
  if (isBranching && (pathGrid[0].x !== bestStartGrid.x || pathGrid[0].y !== bestStartGrid.y)) {
      fullPathGrid.unshift(bestStartGrid);
  } else if (!isBranching) {
      // If not branching, we must ensure the original start is included (A* usually starts at stub or start)
      if (fullPathGrid[0].x !== startGrid.x || fullPathGrid[0].y !== startGrid.y) {
          fullPathGrid.unshift(startGrid);
      }
  }

  const fullPathPixels = fullPathGrid.map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));
  return simplifyPath(fullPathPixels);
};
