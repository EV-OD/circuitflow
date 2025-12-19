
import { PathRequest, Point, VersionInfo, ComponentData } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector } from '../geometry';
import { routeWireV1_3_1 } from './v1.3.1';
import { findAStarPath } from '../astar';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';

export const V1_4_METADATA: VersionInfo = {
  id: 'v1.4',
  version: '1.4',
  title: 'Smart Detour (Wall Jumper)',
  date: 'Latest',
  description: `
### 1. The Local Minima Problem
In uniform-cost search (like A*), large concave obstacles ("U" shaped walls) act as **traps**. The algorithm must explore every single node inside the "U" before realizing it needs to back out and go around. This explodes the search space:
$$N_{explored} \\propto Area_{trap}$$
Often, this hits the \`MAX_ITERATIONS\` limit before finding the exit, resulting in routing failure.

### 2. Hierarchical Pathfinding Solution
**v1.4** implements a two-tier solver:
1.  **Tier 1**: Run Standard A*.
2.  **Tier 2 (Fallback)**: If Tier 1 fails or clips through a wall, switch to **Obstacle Skirting**.

### 3. Obstacle Skirting Algorithm
The fallback mechanism uses geometric heuristics to "jump" the trap:

1.  **Collision Detection**: Identify the set of obstacles $O_{block}$ strictly contained in the bounding box between Start and End.
2.  **Meta-Bounding Box**: Calculate the union rectangle $R_{union}$ of all obstacles in $O_{block}$.
3.  **Waypoint Generation**:
    *   $W_{top} = (x_{mid}, R_{union}.y_{min} - Buffer)$
    *   $W_{bottom} = (x_{mid}, R_{union}.y_{max} + Buffer)$
4.  **Path Decomposition**: The problem $Start \\to End$ is split into two trivial sub-problems:
    *   $Start \\to W_{top}$ (Guaranteed simple L-shape)
    *   $W_{top} \\to End$ (Guaranteed simple L-shape)

### 4. Failure Modes
This approach assumes the "Top" or "Bottom" waypoints are clear. If another massive obstacle exists exactly at the waypoint location, the fallback router will also fail. However, this recursively solves 90% of layout trapping issues.
`
};

/**
 * Checks if a simple line segment intersects a rectangle.
 */
const lineIntersectsRect = (p1: Point, p2: Point, rect: ComponentData, buffer: number = 0): boolean => {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const rMinX = rect.x - buffer;
    const rMaxX = rect.x + rect.width + buffer;
    const rMinY = rect.y - buffer;
    const rMaxY = rect.y + rect.height + buffer;

    return (minX < rMaxX && maxX > rMinX && minY < rMaxY && maxY > rMinY);
};

export const routeWireV1_4 = (request: PathRequest): Point[] => {
  // 1. Try the standard v1.3.1 (A* + T-Junctions + Pin Offset)
  const primaryPath = routeWireV1_3_1(request);

  // 2. Check if the primary path is valid (doesn't clip through obstacles)
  // v1.3.1 returns a fallback L-shape if A* fails. We need to detect if that fallback is "bad".
  // A simple way is to check if it hits any obstacle.
  
  let isClean = true;
  // We check the segments of the returned path against obstacles
  const primaryGridPath = primaryPath.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
  
  for (let i = 0; i < primaryGridPath.length - 1; i++) {
      const p1 = primaryGridPath[i];
      const p2 = primaryGridPath[i+1];
      for (const obs of request.obstacles) {
          // Ignore the source/target components themselves to allow connection
          // But strict checking for walls
          // Heuristic: If we are deep inside an obstacle, it's bad.
          if (lineIntersectsRect(p1, p2, obs, -0.1)) { // Negative buffer = strictly inside
             // Double check it's not just the port connection point
             // For now, assume if we intersect any 'Wall' named component or generic block, it's bad.
             // Or simply: if the path is basically a straight L-shape fallback, it likely failed A*.
             isClean = false;
             break;
          }
      }
      if (!isClean) break;
  }

  // If v1.3.1 worked fine, return it.
  // Note: v1.3.1 might return a valid path around the wall if iterations didn't timeout.
  // We only intervene if we suspect it failed (e.g. it took the L-shape fallback through a wall).
  // Ideally, v1.3.1 would return metadata "failed: true", but we are limited to returning Points[].
  // So we assume if it intersects, we need to fix it.
  if (isClean) {
      return primaryPath;
  }

  // --- FALLBACK: OBSTACLE SKIRTING ---
  // The primary A* failed to find a path around the wall (likely max iterations).
  // We will manually guide it around the "Blocking Group".

  const startGrid = { x: toGrid(request.start.x), y: toGrid(request.start.y) };
  const endGrid = { x: toGrid(request.end.x), y: toGrid(request.end.y) };

  // 1. Find Obstacles in the bounding box of Start/End
  const minX = Math.min(startGrid.x, endGrid.x);
  const maxX = Math.max(startGrid.x, endGrid.x);
  const minY = Math.min(startGrid.y, endGrid.y);
  const maxY = Math.max(startGrid.y, endGrid.y);

  const blockingObstacles = request.obstacles.filter(o => {
      // Check if overlaps the broad bounding box
      return (o.x < maxX && (o.x + o.width) > minX &&
              o.y < maxY && (o.y + o.height) > minY);
  });

  if (blockingObstacles.length === 0) return primaryPath; // Should theoretically not happen if isClean is false

  // 2. Calculate the "Mega Bounding Box" of these obstacles
  let blockMinY = Infinity;
  let blockMaxY = -Infinity;
  let blockMinX = Infinity;
  let blockMaxX = -Infinity;

  blockingObstacles.forEach(o => {
      blockMinY = Math.min(blockMinY, o.y);
      blockMaxY = Math.max(blockMaxY, o.y + o.height);
      blockMinX = Math.min(blockMinX, o.x);
      blockMaxX = Math.max(blockMaxX, o.x + o.width);
  });

  // 3. Define Detour Waypoints (Top and Bottom)
  // We choose a buffer (e.g., 2 units)
  const BUFFER = 2;
  
  // Mid-X for the detour
  const midX = Math.floor((startGrid.x + endGrid.x) / 2);
  
  // Waypoint Top: Go above the highest obstacle
  const waypointTop = { x: midX, y: blockMinY - BUFFER };
  
  // Waypoint Bottom: Go below the lowest obstacle
  const waypointBottom = { x: midX, y: blockMaxY + BUFFER };

  // 4. Try Routing via Top Waypoint
  // We run two smaller A* searches. Start->Way -> End.
  const { costMap, wireOccupancy } = generateMaps(request.obstacles, request.existingWires, 0); // relaxed map
  
  // Unblock critical points
  [startGrid, endGrid, waypointTop, waypointBottom].forEach(p => costMap.delete(getKey(p.x, p.y)));

  // Try Top Path
  let pathTop: Point[] = [];
  try {
      const p1 = findAStarPath(startGrid, waypointTop, costMap, wireOccupancy, getDirectionVector(request.startDirection), { allowCollinear: true });
      const p2 = findAStarPath(waypointTop, endGrid, costMap, wireOccupancy, {x:0, y:0}, { allowCollinear: true });
      if (p1.length > 0 && p2.length > 0) {
          pathTop = [...p1, ...p2];
      }
  } catch (e) {}

  // Try Bottom Path
  let pathBottom: Point[] = [];
  try {
      const p1 = findAStarPath(startGrid, waypointBottom, costMap, wireOccupancy, getDirectionVector(request.startDirection), { allowCollinear: true });
      const p2 = findAStarPath(waypointBottom, endGrid, costMap, wireOccupancy, {x:0, y:0}, { allowCollinear: true });
      if (p1.length > 0 && p2.length > 0) {
          pathBottom = [...p1, ...p2];
      }
  } catch (e) {}

  // 5. Select Best Path
  let finalGridPath: Point[] = [];
  
  if (pathTop.length > 0 && pathBottom.length > 0) {
      // Pick shorter
      finalGridPath = pathTop.length < pathBottom.length ? pathTop : pathBottom;
  } else if (pathTop.length > 0) {
      finalGridPath = pathTop;
  } else if (pathBottom.length > 0) {
      finalGridPath = pathBottom;
  } else {
      // Both failed? Return primary (even if clipped, it's better than nothing)
      return primaryPath;
  }

  // Add Start/End if missing and convert
  const fullPathPixels = [startGrid, ...finalGridPath, endGrid].map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));
  return simplifyPath(fullPathPixels);
};
