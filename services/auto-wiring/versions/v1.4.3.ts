
import { PathRequest, Point, VersionInfo, Direction } from '../types';
import { toGrid, toPixel, getClosestPointOnSegment, getDirectionVector } from '../geometry';
import { routeWireV1_4 } from './v1.4';
import { simplifyPath } from '../simplifier';

export const V1_4_3_METADATA: VersionInfo = {
  id: 'v1.4.3',
  version: '1.4.3',
  title: 'Bidirectional Net Branching',
  date: 'Latest',
  description: `
### 1. Symmetric Network Analysis
Previous versions utilized **Source-Side Branching** (looking for a T-junction at the start). **v1.4.3** introduces **Target-Side Branching**.

### 2. The Use Case: "The Second Wire"
Consider a scenario where Wire A goes from $S_1 \\to D$.
Now, the user draws a new wire from $S_2 \\to D$.
*   **Without v1.4.3**: A second parallel wire runs all the way to $D$.
*   **With v1.4.3**: The engine realizes $D$ is already connected. It scans the existing wire $S_1 \\to D$ and finds the optimal merge point $M$ near $S_2$. It then routes $S_2 \\to M$.

### 3. Algorithm: Reverse Lookahead
1.  **Net Identification**: Detect if \`request.end\` is already an endpoint of an existing wire $W_{target}$.
2.  **Projection**: Project the **Start** coordinate onto $W_{target}$.
    $$P_{merge} = \\text{project}(Start, W_{target})$$
3.  **Heuristic Validation**: Only accept $P_{merge}$ if $|Start - P_{merge}| < |Start - End| - \\epsilon$. This ensures we prefer a short hop to the existing net over a long run to the port.
4.  **Pin Offsetting**: Apply the v1.3.1 pin offset logic to ensure we don't merge exactly on the source pin of the existing wire.
5.  **Dynamic Approach**: Calculate the approach direction based on the orientation of the wire segment at $P_{merge}$.

### 4. Result
This creates "tree" topologies naturally. Wires tend to merge into "trunks" rather than running as independent parallel strands, significantly reducing visual complexity in dense diagrams.
`
};

export const routeWireV1_4_3 = (request: PathRequest): Point[] => {
  const { start, end, existingWires } = request;

  // 1. Identify Target Net (Wires connected to the Destination)
  const targetNet = existingWires.filter(w => {
      const startX = w.points[0].x;
      const startY = w.points[0].y;
      const endX = w.points[w.points.length-1].x;
      const endY = w.points[w.points.length-1].y;
      
      // Check if wire ends or starts at our target
      return (Math.abs(endX - end.x) < 0.1 && Math.abs(endY - end.y) < 0.1) ||
             (Math.abs(startX - end.x) < 0.1 && Math.abs(startY - end.y) < 0.1);
  });

  const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
  const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };

  // 2. Find best split point on Target Net
  let bestTargetPoint = endGrid;
  let minTargetDist = Math.abs(startGrid.x - endGrid.x) + Math.abs(startGrid.y - endGrid.y);
  let foundImprovement = false;
  let bestSegmentOrientation: 'horizontal' | 'vertical' | null = null;

  if (targetNet.length > 0) {
    targetNet.forEach(wire => {
      const gridPoints = wire.points.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
      
      for (let i = 0; i < gridPoints.length - 1; i++) {
        const p1 = gridPoints[i];
        const p2 = gridPoints[i+1];
        
        // Find raw projection point on this segment of the existing wire
        let pt = getClosestPointOnSegment(startGrid, p1, p2);

        // --- PIN OFFSET LOGIC (Target Side) ---
        // We must not merge exactly on a pin of the existing wire
        const isAtStartPin = (pt.x === gridPoints[0].x && pt.y === gridPoints[0].y);
        const isAtEndPin = (pt.x === gridPoints[gridPoints.length-1].x && pt.y === gridPoints[gridPoints.length-1].y);
        
        if (isAtStartPin) {
             const dx = Math.sign(p2.x - p1.x);
             const dy = Math.sign(p2.y - p1.y);
             pt = { x: pt.x + dx, y: pt.y + dy };
        } else if (isAtEndPin) {
             const dx = Math.sign(p1.x - p2.x);
             const dy = Math.sign(p1.y - p2.y);
             pt = { x: pt.x + dx, y: pt.y + dy };
        }

        // Validate we didn't shift off the segment or onto another pin
        const isNowStartPin = (pt.x === gridPoints[0].x && pt.y === gridPoints[0].y);
        const isNowEndPin = (pt.x === gridPoints[gridPoints.length-1].x && pt.y === gridPoints[gridPoints.length-1].y);

        if (isNowStartPin || isNowEndPin) continue;
        // -------------------------------------

        const d = Math.abs(pt.x - startGrid.x) + Math.abs(pt.y - startGrid.y);

        // We apply a small bias (-2) to prefer merging to existing wires over running to the final port
        // This encourages "Tree" structures
        if (d < (minTargetDist - 2)) {
          minTargetDist = d;
          bestTargetPoint = pt;
          foundImprovement = true;
          bestSegmentOrientation = (p1.y === p2.y) ? 'horizontal' : 'vertical';
        }
      }
    });
  }

  // 3. Construct Modified Request
  let finalRequest = request;

  if (foundImprovement) {
      // Calculate appropriate approach direction for the new target point
      // If we are merging into a horizontal wire from above, we should approach from 'top'
      let newEndDirection: Direction = request.endDirection; // fallback

      if (bestSegmentOrientation === 'horizontal') {
          // If start is above target, we come from top
          newEndDirection = (startGrid.y < bestTargetPoint.y) ? 'top' : 'bottom';
      } else {
          // If start is left of target, we come from left
          newEndDirection = (startGrid.x < bestTargetPoint.x) ? 'left' : 'right';
      }

      finalRequest = {
          ...request,
          end: { x: toPixel(bestTargetPoint.x), y: toPixel(bestTargetPoint.y) },
          endDirection: newEndDirection
      };
  }

  // 4. Delegate to v1.4 (which has Wall Jumper + v1.3.1 Source Branching)
  // This ensures we get all previous features (Obstacle avoidance, Source splitting, etc.)
  // but with a potentially optimized Destination.
  return routeWireV1_4(finalRequest);
};
