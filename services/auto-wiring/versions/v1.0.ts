
import { PathRequest, Point, VersionInfo } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector } from '../geometry';
import { findAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';

export const V1_0_METADATA: VersionInfo = {
  id: 'v1.0',
  version: '1.0',
  title: 'Strict Manhattan A*',
  date: 'Oct 2023',
  description: `
### 1. Introduction
This is the foundational implementation of the auto-wiring engine. It utilizes the **A* (A-Star)** search algorithm adapted for **Manhattan geometry** (orthogonal L1 norm). It enforces strict design rules, ensuring wires never overlap with components or cross each other illegitimately.

### 2. Mathematical Model
The total cost function $f(n)$ for any node $n$ is defined as:

$$f(n) = g(n) + h(n)$$

| Term | Definition | Formula |
| :--- | :--- | :--- |
| **$g(n)$** | Exact cost from Start to $n$. | $g(parent) + 10 + Penalty$ |
| **$h(n)$** | Heuristic estimated cost from $n$ to End. | $|x_n - x_{end}| + |y_n - y_{end}|$ |

#### Cost Coefficients
* **Base Move**: 10
* **Turn Penalty**: 500 (Heavily penalizes changing direction to prevent "stair-casing")
* **Obstacle**: $\\infty$ (Strict binary blockage)

### 3. Algorithm & Data Structures
* **Data Structure**: Min-Heap (Priority Queue) for $O(1)$ minimum extraction and $O(\\log N)$ insertion.
* **Spatial Hashing**: Uses a \`Map<string, number>\` with key format \`"x,y"\` for constant-time collision lookups.
* **Strict Buffering**: A 1-unit buffer is mathematically added to all obstacle bounding boxes:
  \`\`\`typescript
  // Obstacle expansion
  for (x = obs.x - 1; x < obs.endX + 1; x++) ...
  \`\`\`

### 4. Failure Modes
* **The Iron Wall**: Because every component has a strict 1-unit buffer, two components placed 1 unit apart create a combined 2-unit invisible wall. Wires cannot squeeze between them, even if there is visually space.
* **No Crossing**: This version treats other wires as hard obstacles ($\cos t = \\infty$). It cannot create jumpers or cross nets, meaning a "ring" of wires effectively isolates the interior of the canvas.
`
};

export const routeWireV1 = (request: PathRequest): Point[] => {
  const { start, startDirection, end, endDirection, obstacles, existingWires } = request;

  // Pre-calculate grid points
  const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
  const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };

  const startDirVec = getDirectionVector(startDirection);
  const endDirVec = getDirectionVector(endDirection);

  const startStub = { 
    x: startGrid.x + startDirVec.x, 
    y: startGrid.y + startDirVec.y 
  };
  
  const endStub = {
    x: endGrid.x + endDirVec.x,
    y: endGrid.y + endDirVec.y
  };

  // v1.0: Single Attempt, strict buffering, no collinear overlap allowed
  const { costMap, wireOccupancy } = generateMaps(obstacles, existingWires, 1);

  // Unblock Ports and Stubs
  const pointsToUnblock = [startGrid, startStub, endGrid, endStub];
  pointsToUnblock.forEach(p => {
    const key = getKey(p.x, p.y);
    costMap.delete(key);
  });

  const pathGrid = findAStarPath(
      startStub, 
      endStub, 
      costMap, 
      wireOccupancy, 
      startDirVec,
      { allowCollinear: false }
  );

  if (pathGrid.length === 0) {
      console.warn("v1.0 Route failed. No path found.");
      return [];
  }

  // Reconstruct full path
  const fullPathGrid = [startGrid, ...pathGrid, endGrid];
  const fullPathPixels = fullPathGrid.map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));

  return simplifyPath(fullPathPixels);
};
