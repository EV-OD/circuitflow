
import { PathRequest, Point, VersionInfo, Wire, Direction, ComponentData, DebugRect } from '../types';
import { toGrid, toPixel, getClosestPointOnSegment, getDirectionVector } from '../geometry';
import { routeWireV1_5_2 } from './v1.5.2';
import { calculateEnhancedFreeSpace } from './v1.4.4.1';

export const V1_6_METADATA: VersionInfo = {
  id: 'v1.6',
  version: '1.6.1',
  title: 'Global Net-Aware Steiner Trees (Refined)',
  date: 'Latest',
  description: `
### 1. The Global Connectivity Model
Previous versions viewed routing as a series of isolated $A \\to B$ requests. **v1.6** introduces **Network Awareness**. It understands that a pin is not just a point, but an entry point into a connected electrical net.

### 2. Multi-Candidate Steiner Tree
When you connect $Start \\to End$, the engine now performs a global query:
1.  **Trace Net A**: Find all wires physically connected to the Start pin (recursive traversal).
2.  **Trace Net B**: Find all wires physically connected to the End pin.
3.  **Bridge Discovery**: The engine calculates the optimal geometric "Bridge" between these two sets.
    *   *Candidate 1*: $Start \\to End$ (Standard)
    *   *Candidate 2*: $Start \\to P_{closest\_on\_NetB}$
    *   *Candidate 3*: $P_{closest\_on\_NetA} \\to End$

### 3. Safety & Cleanup (v1.6.1)
*   **Graph-Aware Validation**: T-Junction candidates are now validated against the **Free Space Graph (Rectangles)**. A split point is only valid if it lies within a routable corridor (Maximal Empty Rectangle), ensuring connections aren't made in buffer zones or inside obstacles.
*   **Pin Direction**: If a T-junction occurs exactly at a pin (Daisy Chain), the engine respects the pin's exit direction.
*   **Loop Prevention**: Prevents creating zero-length bridges if the nets are already connected.

### 4. Bi-Directional Optimization
The algorithm is direction-agnostic. Dragging from Source to Target or Target to Source yields the same optimal tree structure.
`
};

export const routeWireV1_6 = (request: PathRequest): Point[] => {
    const { start, end, existingWires, startPortId, endPortId, obstacles } = request;
    const startGrid = { x: toGrid(start.x), y: toGrid(start.y) };
    const endGrid = { x: toGrid(end.x), y: toGrid(end.y) };

    // --- 0. Pre-calculate Free Space Graph ---
    // We use this to validate that our potential T-Junction points are actually reachable/valid.
    const rects = calculateEnhancedFreeSpace(obstacles, existingWires);

    // --- 1. Graph Traversal: Build Nets ---
    const getConnectedSegments = (initialPortId: string | undefined, initialPoint: Point) => {
        const connectedWires = new Set<Wire>();
        const segments: {p1: Point, p2: Point}[] = [];
        const queue: Wire[] = [];

        existingWires.forEach(w => {
            if (!w.points || w.points.length === 0) return;
            
            // Check connectivity via Port ID or Physical Location
            const matchesPort = initialPortId && (w.sourcePortId === initialPortId || w.destPortId === initialPortId);
            const matchesLoc = isPointSame(w.points[0], initialPoint) || isPointSame(w.points[w.points.length-1], initialPoint);

            if (matchesPort || matchesLoc) {
                queue.push(w);
                connectedWires.add(w);
            }
        });

        while(queue.length > 0) {
            const curr = queue.shift()!;
            if (!curr.points || curr.points.length === 0) continue;

            const gridPoints = curr.points.map(p => ({ x: toGrid(p.x), y: toGrid(p.y) }));
            for(let i=0; i<gridPoints.length-1; i++) {
                segments.push({ p1: gridPoints[i], p2: gridPoints[i+1] });
            }
            existingWires.forEach(w => {
                if (!connectedWires.has(w)) {
                    const sharesSource = curr.sourcePortId === w.sourcePortId || curr.sourcePortId === w.destPortId;
                    const sharesTarget = curr.destPortId === w.sourcePortId || curr.destPortId === w.destPortId;
                    if (sharesSource || sharesTarget) {
                        connectedWires.add(w);
                        queue.push(w);
                    }
                }
            });
        }
        return { segments, wires: connectedWires };
    };

    const isPointSame = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1;

    const netA = getConnectedSegments(startPortId, start);
    const netB = getConnectedSegments(endPortId, end);

    // Stop if nets are already same (Loop prevention)
    const areNetsConnected = [...netA.wires].some(w => netB.wires.has(w));
    if (areNetsConnected) {
        return routeWireV1_5_2(request);
    }

    // --- 2. Candidate Evaluation ---
    let bestStart = startGrid;
    let bestEnd = endGrid;
    let bestDist = dist(startGrid, endGrid);
    let bestEndDirection = request.endDirection;
    let bestStartDirection = request.startDirection;
    
    // Candidate 2: Start -> Closest point on Net B
    if (netB.segments.length > 0) {
        // Find point, using RECTS for validation
        const { point, d, orientation, isEndpoint } = findClosestPointOnSegments(startGrid, netB.segments, rects);
        
        if (point && d < bestDist - 1) {
            const correctedPoint = applyPinOffset(point, netB.segments);
            bestStart = startGrid;
            bestEnd = correctedPoint;
            bestDist = d;
            
            if (isEndpoint) {
                 bestEndDirection = (startGrid.y < correctedPoint.y) ? 'top' : 'bottom';
            } else {
                 if (orientation === 'horizontal') {
                    bestEndDirection = (startGrid.y < correctedPoint.y) ? 'top' : 'bottom';
                 } else {
                    bestEndDirection = (startGrid.x < correctedPoint.x) ? 'left' : 'right';
                 }
            }
        }
    }

    // Candidate 3: Closest point on Net A -> End
    if (netA.segments.length > 0) {
        const { point, d, orientation, isEndpoint } = findClosestPointOnSegments(endGrid, netA.segments, rects);
        
        if (point && d < bestDist - 1) {
             const correctedPoint = applyPinOffset(point, netA.segments);
             bestStart = correctedPoint;
             bestEnd = endGrid;
             bestDist = d;

             if (isEndpoint) {
                 bestStartDirection = (endGrid.y < correctedPoint.y) ? 'bottom' : 'top';
                 if (Math.abs(endGrid.x - correctedPoint.x) > Math.abs(endGrid.y - correctedPoint.y)) {
                     bestStartDirection = (endGrid.x < correctedPoint.x) ? 'left' : 'right';
                 }
             } else {
                 if (orientation === 'horizontal') {
                     bestStartDirection = (endGrid.y < correctedPoint.y) ? 'top' : 'bottom';
                 } else {
                     bestStartDirection = (endGrid.x < correctedPoint.x) ? 'left' : 'right';
                 }
             }
        }
    }

    const newRequest: PathRequest = {
        ...request,
        start: { x: toPixel(bestStart.x), y: toPixel(bestStart.y) },
        startDirection: bestStartDirection,
        end: { x: toPixel(bestEnd.x), y: toPixel(bestEnd.y) },
        endDirection: bestEndDirection
    };

    return routeWireV1_5_2(newRequest);
};

// --- Helpers ---

const dist = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

// Check if a point is in a valid routing rectangle
const isValidPoint = (p: Point, rects: DebugRect[]) => {
    return rects.some(r => 
        p.x >= r.x && p.x <= r.x + r.width &&
        p.y >= r.y && p.y <= r.y + r.height
    );
};

const findClosestPointOnSegments = (target: Point, segments: {p1: Point, p2: Point}[], rects: DebugRect[]) => {
    let closestDist = Infinity;
    let closestPoint: Point | null = null;
    let orientation: 'horizontal' | 'vertical' = 'horizontal';
    let isEndpoint = false;

    segments.forEach(seg => {
        const pt = getClosestPointOnSegment(target, seg.p1, seg.p2);
        
        // Critical: Validate point against Free Space Graph (Rectangles)
        // This ensures we don't pick a point in a buffer zone or inside an obstacle
        // (unless it's an existing wire endpoint which might be inside a port buffer, which is fine)
        const matchesP1 = (pt.x === seg.p1.x && pt.y === seg.p1.y);
        const matchesP2 = (pt.x === seg.p2.x && pt.y === seg.p2.y);
        
        if (!matchesP1 && !matchesP2 && !isValidPoint(pt, rects)) {
            return; // Reject mid-segment split in invalid space
        }

        const d = dist(target, pt);
        
        if (d < closestDist) {
            closestDist = d;
            closestPoint = pt;
            orientation = (seg.p1.y === seg.p2.y) ? 'horizontal' : 'vertical';
            isEndpoint = matchesP1 || matchesP2;
        }
    });

    return { point: closestPoint, d: closestDist, orientation, isEndpoint };
};

const applyPinOffset = (pt: Point, segments: {p1: Point, p2: Point}[]) => {
    for (const seg of segments) {
        if (pt.x === seg.p1.x && pt.y === seg.p1.y) {
            const dx = Math.sign(seg.p2.x - seg.p1.x);
            const dy = Math.sign(seg.p2.y - seg.p1.y);
            return { x: pt.x + dx, y: pt.y + dy };
        }
        if (pt.x === seg.p2.x && pt.y === seg.p2.y) {
            const dx = Math.sign(seg.p1.x - seg.p2.x);
            const dy = Math.sign(seg.p1.y - seg.p2.y);
            return { x: pt.x + dx, y: pt.y + dy };
        }
    }
    return pt;
};
