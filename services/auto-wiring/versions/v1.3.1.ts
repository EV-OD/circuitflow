
import { PathRequest, Point, VersionInfo } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector, getClosestPointOnSegment } from '../geometry';
import { findAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';

export const V1_3_1_METADATA: VersionInfo = {
  id: 'v1.3.1',
  version: '1.3.1',
  title: 'Graph-Aware + Pin Offset',
  date: 'Latest',
  description: `
### 1. Design Rule Checking (DRC)
**v1.3.1** introduces a specific DRC constraint: **"No T-Junctions at Ports."** 
In circuit schematics, a T-junction directly on a pin is visually confusing. It is unclear if the wire continues through the pin or ends at it.

### 2. The Offset Algorithm
The engine performs a post-processing step on the **Split Point** $P_{split}$ calculated in v1.3.

Let the segment of the existing wire be defined by endpoints $A$ and $B$.
If $P_{split}$ coincides with $A$ or $B$ (which are the pin locations):

$$
P_{corrected} = P_{split} + \\vec{u}
$$

Where $\\vec{u}$ is a unit vector pointing **inward** along the wire segment.
* If $P_{split} == A$, $\\vec{u} = \\text{sign}(B - A)$
* If $P_{split} == B$, $\\vec{u} = \\text{sign}(A - B)$

### 3. Edge Case Handling
* **Short Wires**: If the existing wire has length 1 (i.e., $|B - A| = 1$), offsetting from $A$ puts us at $B$, which is also a pin. In this specific case, the algorithm aborts the offset and allows the pin-junction to ensure connectivity, prioritizing electrical validity over aesthetic preference.
`
};

export const routeWireV1_3_1 = (request: PathRequest): Point[] => {
  const { start, startDirection, end, endDirection, obstacles, existingWires } = request;

  // 1. Net Detection
  // Find wires that share a connection with our Start point (either at their source or target)
  const sourceNet = existingWires.filter(w => {
      if (!w.points || w.points.length === 0) return false;
      const startX = w.points[0].x;
      const startY = w.points[0].y;
      const endX = w.points[w.points.length-1].x;
      const endY = w.points[w.points.length-1].y;
      
      const isStart = (Math.abs(startX - start.x) < 0.1 && Math.abs(startY - start.y) < 0.1);
      const isEnd = (Math.abs(endX - start.x) < 0.1 && Math.abs(endY - start.y) < 0.1);
      
      return isStart || isEnd;
  });

  const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
  const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };
  const endDirVec = getDirectionVector(endDirection);
  
  const endStub = {
    x: endGrid.x + endDirVec.x,
    y: endGrid.y + endDirVec.y
  };

  // --- Determine Start Point (T-Junction Logic with Offset) ---
  let bestStartGrid = startGrid;
  let bestStartDirVec = getDirectionVector(startDirection);
  let isBranching = false;

  if (sourceNet.length > 0) {
    let closestDist = Infinity;
    let closestPoint = startGrid;

    // Check every segment of every wire in the net
    sourceNet.forEach(wire => {
      const gridPoints = wire.points.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
      
      for (let i = 0; i < gridPoints.length - 1; i++) {
        const p1 = gridPoints[i];
        const p2 = gridPoints[i+1];
        
        // Find raw projection point
        let pt = getClosestPointOnSegment(endGrid, p1, p2);

        // --- PIN OFFSET LOGIC ---
        // Check if pt is exactly on a pin (Start or End of the WHOLE wire)
        const isAtStartPin = (pt.x === gridPoints[0].x && pt.y === gridPoints[0].y);
        const isAtEndPin = (pt.x === gridPoints[gridPoints.length-1].x && pt.y === gridPoints[gridPoints.length-1].y);
        
        if (isAtStartPin) {
             // Shift 1 unit towards p2
             const dx = Math.sign(p2.x - p1.x);
             const dy = Math.sign(p2.y - p1.y);
             pt = { x: pt.x + dx, y: pt.y + dy };
        } else if (isAtEndPin) {
             // Shift 1 unit towards p1 (previous point relative to segment end)
             // Note: p1 is the start of THIS segment. If we are at p2 (which is the wire end), we move towards p1.
             const dx = Math.sign(p1.x - p2.x);
             const dy = Math.sign(p1.y - p2.y);
             pt = { x: pt.x + dx, y: pt.y + dy };
        }

        // Re-check validity: Did we shift onto another pin? (e.g. wire length 1)
        const isNowStartPin = (pt.x === gridPoints[0].x && pt.y === gridPoints[0].y);
        const isNowEndPin = (pt.x === gridPoints[gridPoints.length-1].x && pt.y === gridPoints[gridPoints.length-1].y);

        if (isNowStartPin || isNowEndPin) {
            continue; // Segment too short to split with offset
        }
        // -----------------------

        const d = Math.abs(pt.x - endGrid.x) + Math.abs(pt.y - endGrid.y);

        if (d < closestDist) {
          closestDist = d;
          closestPoint = pt;
        }
      }
    });

    // Check if branching is beneficial (closer than original start)
    const originalDist = Math.abs(startGrid.x - endGrid.x) + Math.abs(startGrid.y - endGrid.y);
    
    // We are slightly more aggressive with branching in v1.3.1 to prefer nodes
    if (closestDist < originalDist) {
       bestStartGrid = closestPoint;
       bestStartDirVec = { 
         x: Math.sign(endGrid.x - bestStartGrid.x), 
         y: Math.sign(endGrid.y - bestStartGrid.y) 
       };
       if (bestStartDirVec.x !== 0) bestStartDirVec.y = 0; // Normalize to orthogonal
       isBranching = true;
    }
  }

  // --- A* Execution ---
  const attempts = [
    { name: "Strict", buffer: 1, allowCollinear: false },
    { name: "Soft Buffer", buffer: 0, allowCollinear: false },
    { name: "Soft Overlap", buffer: 0, allowCollinear: true }
  ];

  let pathGrid: Point[] = [];

  for (const attempt of attempts) {
      const { costMap, wireOccupancy } = generateMaps(obstacles, existingWires, attempt.buffer);

      // Unblock Start Node (Split Point)
      costMap.delete(getKey(bestStartGrid.x, bestStartGrid.y));

      // Unblock End
      [endGrid, endStub].forEach(p => costMap.delete(getKey(p.x, p.y)));

      // If NOT branching, unblock the standard start stub from the port
      if (!isBranching) {
        const startDirVec = getDirectionVector(startDirection);
        const startStub = { x: startGrid.x + startDirVec.x, y: startGrid.y + startDirVec.y };
        costMap.delete(getKey(startGrid.x, startGrid.y));
        costMap.delete(getKey(startStub.x, startStub.y));
      }

      pathGrid = findAStarPath(
          bestStartGrid, 
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
  
  // Ensure connection to start point
  if (isBranching) {
      if (pathGrid[0].x !== bestStartGrid.x || pathGrid[0].y !== bestStartGrid.y) {
          fullPathGrid.unshift(bestStartGrid);
      }
  } else {
      if (fullPathGrid[0].x !== startGrid.x || fullPathGrid[0].y !== startGrid.y) {
          fullPathGrid.unshift(startGrid);
      }
  }

  const fullPathPixels = fullPathGrid.map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));
  return simplifyPath(fullPathPixels);
};
