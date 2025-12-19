
import { PathRequest, Point, VersionInfo, ComponentData, DebugRect } from '../types';
import { routeWireV1_4 } from './v1.4';
import { GRID_SIZE, CANVAS_SIZE } from '../../../constants';

export const V1_4_4_METADATA: VersionInfo = {
  id: 'v1.4.4',
  version: '1.4.4',
  title: 'Space Partitioning (Debug)',
  date: 'Experimental',
  description: `
### 1. Free Space Decomposition
This version introduces a spatial analysis layer. Before routing, it calculates the "Negative Space" of the board—finding all available rectangular regions that do not contain obstacles.

### 2. Recursive Partitioning Algorithm
To generate the squares shown in the background:
1.  **Initialization**: Start with a single rectangle covering the entire canvas.
2.  **Intersection**: Find the first component that overlaps the current rectangle.
3.  **Splitting**: If an overlap is found, subtract the component from the rectangle. This operation splits the original rectangle into up to 4 smaller, non-overlapping sub-rectangles (Top, Bottom, Left, Right) that surround the obstacle.
4.  **Recursion**: Recursively apply steps 2-3 to the new sub-rectangles until no obstacles remain inside them.

### 3. Usage
This logic is the precursor to **Grid-Based Region Routing**. By understanding the "shape" of the empty space, future algorithms can route wires through the center of these corridors rather than hugging obstacle walls.

*   **Inset**: The visualized squares have a fixed inner padding to demonstrate "safe corridors".
*   **Animation**: Click the "Animate Space" button to replay the partitioning process.
`
};

// Use v1.4 for actual wiring for now, as this version focuses on the Space Partitioning visual
export const routeWireV1_4_4 = (request: PathRequest): Point[] => {
    return routeWireV1_4(request);
};

// --- SPACE PARTITIONING LOGIC ---

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// Checks if two rects intersect
const intersect = (r1: Rect, r2: Rect) => {
    return !(r2.x >= r1.x + r1.w || 
             r2.x + r2.w <= r1.x || 
             r2.y >= r1.y + r1.h || 
             r2.y + r2.h <= r1.y);
};

/**
 * Recursively splits a rectangle 'space' by the first obstacle 'obs' it encounters.
 * Returns a list of clear rectangles.
 */
const recursiveSplit = (space: Rect, obstacles: Rect[]): Rect[] => {
    // 1. Find the first obstacle that intersects this space
    const obs = obstacles.find(o => intersect(space, o));

    // Base Case: No intersection, this space is valid free space
    if (!obs) {
        return [space];
    }

    // Recursive Step: Split space around the obstacle
    // We create 4 partitions relative to the intersection. 
    // To ensure NO OVERLAP between the resulting 4 rects, we confine the Left/Right strips to the height of the obstacle.
    const result: Rect[] = [];

    // Top Rect (Full Width)
    if (obs.y > space.y) {
        const h = obs.y - space.y;
        result.push({ x: space.x, y: space.y, w: space.w, h: h });
    }

    // Bottom Rect (Full Width)
    if (obs.y + obs.h < space.y + space.h) {
        const h = (space.y + space.h) - (obs.y + obs.h);
        result.push({ x: space.x, y: obs.y + obs.h, w: space.w, h: h });
    }

    // Left Rect (Confined height to obstacle)
    if (obs.x > space.x) {
        const w = obs.x - space.x;
        // The Y bounds are clamped to the intersection area (max of space.y/obs.y to min of space.bottom/obs.bottom)
        // However, since we already sliced Top and Bottom above, we only need the middle strip.
        const y1 = Math.max(space.y, obs.y);
        const y2 = Math.min(space.y + space.h, obs.y + obs.h);
        if (y2 > y1) {
             result.push({ x: space.x, y: y1, w: w, h: y2 - y1 });
        }
    }

    // Right Rect (Confined height to obstacle)
    if (obs.x + obs.w < space.x + space.w) {
        const w = (space.x + space.w) - (obs.x + obs.w);
        const y1 = Math.max(space.y, obs.y);
        const y2 = Math.min(space.y + space.h, obs.y + obs.h);
        if (y2 > y1) {
            result.push({ x: obs.x + obs.w, y: y1, w: w, h: y2 - y1 });
        }
    }

    // Recurse on the new pieces because they might hit *other* obstacles
    let finalSpaces: Rect[] = [];
    for (const subSpace of result) {
        finalSpaces = [...finalSpaces, ...recursiveSplit(subSpace, obstacles)];
    }

    return finalSpaces;
};

export const calculateFreeSpace = (components: ComponentData[]): DebugRect[] => {
    const gridW = Math.ceil(CANVAS_SIZE.width / GRID_SIZE);
    const gridH = Math.ceil(CANVAS_SIZE.height / GRID_SIZE);

    const world: Rect = { x: 0, y: 0, w: gridW, h: gridH };
    
    // Convert components to simple rects
    const obstacles: Rect[] = components.map(c => ({
        x: c.x,
        y: c.y,
        w: c.width,
        h: c.height
    }));

    const rawRects = recursiveSplit(world, obstacles);

    // Convert to DebugRects and add color
    // We add a slight inset visual logic in the renderer, but the data is pure grid
    return rawRects.map((r, i) => ({
        id: `dbg_${i}`,
        x: r.x,
        y: r.y,
        width: r.w,
        height: r.h,
        color: '#22d3ee' // Cyan-400
    }));
};
