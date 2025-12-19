
import { Wire, XY } from '../../types';

export interface WireHitResult {
    wireId: string;
    segmentIndex: number; // Index in the FULL path (0 = Start->P0, etc)
    orientation: 'horizontal' | 'vertical';
    allPoints: XY[]; // Return the full path used for calc
}

const HIT_THRESHOLD = 8;

const distanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    
    return Math.hypot(px - projX, py - projY);
};

export const hitTestWire = (
    wires: Wire[], 
    x: number, 
    y: number,
    resolveEndpoints: (wire: Wire) => { start: XY, end: XY } | null
): WireHitResult | null => {
    for (const wire of wires) {
        const endpoints = resolveEndpoints(wire);
        if (!endpoints) continue;

        // Construct Full Path: Start -> [Points] -> End
        const fullPoints: XY[] = [
            endpoints.start,
            ...(wire.points || []),
            endpoints.end
        ];

        for (let i = 0; i < fullPoints.length - 1; i++) {
            const p1 = fullPoints[i];
            const p2 = fullPoints[i + 1];
            
            const dist = distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            
            if (dist < HIT_THRESHOLD) {
                const dx = Math.abs(p1.x - p2.x);
                const dy = Math.abs(p1.y - p2.y);
                const orientation = dx > dy ? 'horizontal' : 'vertical';

                return {
                    wireId: wire.id,
                    segmentIndex: i,
                    orientation,
                    allPoints: fullPoints
                };
            }
        }
    }
    return null;
};
