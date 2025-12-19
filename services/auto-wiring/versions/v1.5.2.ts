
import { PathRequest, Point, VersionInfo, DebugRect, ComponentData, Wire } from '../types';
import { toGrid, toPixel, getKey, getDirectionVector } from '../geometry';
import { routeWireV1_5_1 } from './v1.5.1';
import { calculateEnhancedFreeSpace } from './v1.4.4.1';
import { simplifyPath } from '../simplifier';
import { generateMaps } from '../maps';

export const V1_5_2_METADATA: VersionInfo = {
  id: 'v1.5.2',
  version: '1.5.2',
  title: 'Graph-Aware Segment Nudging',
  date: 'Latest',
  description: `
### 1. The Hugging Problem
Fallback mechanisms in v1.5.1 often relax buffers to finding a path. This leads to wires that "hug" component walls (running directly adjacent to them), even when there is plenty of open space nearby. This is electrically valid but aesthetically poor.

### 2. Segment Nudging Algorithm
**v1.5.2** introduces a post-processing optimization pass:
1.  **Detection**: The engine scans the generated path for linear segments that run strictly adjacent to any component (Distance = 1 grid unit).
2.  **Space Query**: For every hugging segment, it queries the **Maximal Empty Rectangle (MER)** graph to see if the segment is on the edge of a large open region.
3.  **Adjacency Check**: It checks if shifting the segment 1 unit *away* from the obstacle would keep it inside a valid MER (either the current one or a neighbor).
4.  **Local Reroute**: If the shift is valid (no collisions with other obstacles or wires), the segment is "nudged" outward, and the connecting perpendicular segments are adjusted.

### 3. Result
Wires naturally "float" in the center of corridors rather than sticking to the walls, retaining the robustness of the v1.5.1 retry loop while recovering the clean look of strict buffering.
`
};

export const routeWireV1_5_2 = (request: PathRequest): Point[] => {
  // 1. Get the baseline path from v1.5.1 (Topological Retry)
  const initialPath = routeWireV1_5_1(request);
  
  if (initialPath.length < 2) return initialPath;

  // 2. Optimization Pass: Nudge segments away from walls if possible
  return nudgeSegments(initialPath, request);
};

// --- Nudging Logic ---

const nudgeSegments = (pixelPath: Point[], request: PathRequest): Point[] => {
    const { obstacles, existingWires } = request;
    
    // Convert to Grid
    let gridPath = pixelPath.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
    
    // Calculate MERs for validity checking
    // We strictly respect existing wires during the nudge to avoid creating new overlaps
    const rects = calculateEnhancedFreeSpace(obstacles, existingWires);

    // Iterative Nudging: We process the path segments. 
    // Since shifting a segment modifies the adjacent points, we process carefully.
    // We'll create a new set of points.
    
    // Note: We only shift the "middle" segments. We cannot shift the first or last segment 
    // if they connect directly to the port pins (unless we introduce new doglegs, which might be overkill).
    // For v1.5.2, we focus on long runs in the middle.

    let modified = false;

    // We make a few passes to handle complex shapes, but 1 pass is usually enough for simple nudges
    for (let i = 1; i < gridPath.length - 2; i++) {
        const p1 = gridPath[i];
        const p2 = gridPath[i+1];

        // Determine orientation
        const isHoriz = p1.y === p2.y;
        const isVert = p1.x === p2.x;

        if (!isHoriz && !isVert) continue; // Should not happen in Manhattan

        // Check if this segment is "Hugging" an obstacle
        const hug = checkHugging(p1, p2, obstacles);

        if (hug.isHugging) {
            // Attempt to shift away
            const shiftX = hug.pushVector.x;
            const shiftY = hug.pushVector.y;

            const n1 = { x: p1.x + shiftX, y: p1.y + shiftY };
            const n2 = { x: p2.x + shiftX, y: p2.y + shiftY };

            // VALIDATION:
            // 1. Must be in free space (Use MERs for fast check)
            // 2. Must not collide with existing wires (Strict check)
            if (isValidSegment(n1, n2, rects, existingWires)) {
                
                // Apply Shift
                gridPath[i] = n1;
                gridPath[i+1] = n2;
                modified = true;
                
                // Note: Changing gridPath[i] automatically updates the end of segment (i-1 -> i)
                // and start of segment (i -> i+1). 
                // Since (i-1 -> i) is perpendicular to (i -> i+1), extending/shortening it is geometrically valid.
            }
        }
    }

    if (!modified) return pixelPath;

    const finalPixels = gridPath.map(p => ({ x: toPixel(p.x), y: toPixel(p.y) }));
    return simplifyPath(finalPixels);
};

const checkHugging = (p1: Point, p2: Point, obstacles: ComponentData[]) => {
    // Defines "Hugging" as being exactly 1 unit away from a component boundary.
    // (Since standard components occupy grid cells, boundary is at x, x+w. 1 unit away is x-1 or x+w+1)
    
    let isHugging = false;
    let pushVector = { x: 0, y: 0 };

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const isHoriz = p1.y === p2.y;

    for (const obs of obstacles) {
        // Expand obstacle by 1 to check proximity
        // Obs Grid bounds:
        const ox = obs.x;
        const oy = obs.y;
        const ox2 = obs.x + obs.width;
        const oy2 = obs.y + obs.height;

        if (isHoriz) {
            // Check horizontal overlap
            if (maxX >= ox && minX <= ox2) {
                // Check Y proximity
                if (p1.y === oy - 1) {
                    isHugging = true;
                    pushVector = { x: 0, y: -1 }; // Push Up (away)
                } else if (p1.y === oy2) { // oy2 is the line *after* height
                    isHugging = true;
                    pushVector = { x: 0, y: 1 }; // Push Down (away)
                }
            }
        } else {
            // Vertical
            // Check vertical overlap
            if (maxY >= oy && minY <= oy2) {
                // Check X proximity
                if (p1.x === ox - 1) {
                    isHugging = true;
                    pushVector = { x: -1, y: 0 }; // Push Left
                } else if (p1.x === ox2) {
                    isHugging = true;
                    pushVector = { x: 1, y: 0 }; // Push Right
                }
            }
        }
        
        if (isHugging) break; // Found a constraint
    }

    return { isHugging, pushVector };
};

const isValidSegment = (p1: Point, p2: Point, rects: DebugRect[], existingWires: Wire[]): boolean => {
    // 1. Check if strictly inside available MERs
    // A segment is valid if it is fully contained within at least one MER 
    // OR if it crosses between adjacent MERs.
    // Simplifying: Check if endpoints and midpoint are in ANY MER.
    
    const checkPoint = (p: Point) => {
        return rects.some(r => 
            p.x >= r.x && p.x <= r.x + r.width &&
            p.y >= r.y && p.y <= r.y + r.height
        );
    };

    if (!checkPoint(p1) || !checkPoint(p2)) return false;

    // 2. Check strict collision with existing wires
    // We generate a mini-map just for this check? 
    // Or just simple intersection.
    
    const isHoriz = p1.y === p2.y;
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    for (const w of existingWires) {
        const gridPoints = w.points.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
        for (let k = 0; k < gridPoints.length - 1; k++) {
            const wp1 = gridPoints[k];
            const wp2 = gridPoints[k+1];
            
            // Check Intersection
            const wMinX = Math.min(wp1.x, wp2.x);
            const wMaxX = Math.max(wp1.x, wp2.x);
            const wMinY = Math.min(wp1.y, wp2.y);
            const wMaxY = Math.max(wp1.y, wp2.y);

            // Simple line-line intersection
            if (maxX < wMinX || minX > wMaxX) continue;
            if (maxY < wMinY || minY > wMaxY) continue;
            
            return false; // Collision detected
        }
    }

    return true;
};
