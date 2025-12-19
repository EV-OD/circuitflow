
import { Wire, XY } from '../../types';
import { GRID_SIZE } from '../../constants';

export const calculateWireDrag = (
    wire: Wire,
    segmentIndex: number,
    dragDelta: XY, 
    orientation: 'horizontal' | 'vertical',
    endpoints: { start: XY, end: XY }
): XY[] => {
    // Reconstruct full path for logic: [Start, ...Intermediates, End]
    // The wire.points array only holds intermediates.
    const intermediates = wire.points ? [...wire.points] : [];
    
    // Logic:
    // If we drag a segment, we are moving the points at indices `segmentIndex` and `segmentIndex - 1` (conceptually)
    // in the full path array [S, p0, p1, ... E].
    // Full path indices: 0 is S, 1 is p0, length-1 is E.
    
    // Determine which points in the *intermediate* array need to move or be created.
    // segmentIndex 0 means we are dragging the line between Start and (P0 or End).
    // segmentIndex K means we are dragging between P(k-1) and P(k) (or End).

    let moveX = 0;
    let moveY = 0;

    // Calculate snapped movement
    if (orientation === 'horizontal') {
        // We need a reference Y. We can use the start point of the segment.
        // If segment 0, Start.y. If segment 1, P0.y.
        const refY = segmentIndex === 0 ? endpoints.start.y : intermediates[segmentIndex - 1].y;
        const rawNewY = refY + dragDelta.y;
        const snappedY = Math.round(rawNewY / GRID_SIZE) * GRID_SIZE;
        moveY = snappedY - refY;
    } else {
        const refX = segmentIndex === 0 ? endpoints.start.x : intermediates[segmentIndex - 1].x;
        const rawNewX = refX + dragDelta.x;
        const snappedX = Math.round(rawNewX / GRID_SIZE) * GRID_SIZE;
        moveX = snappedX - refX;
    }

    if (moveX === 0 && moveY === 0) return intermediates;

    // Apply Move
    // We strictly return a NEW intermediate array.
    const newPoints = [...intermediates];

    // Case 1: Dragging the FIRST segment (Start -> P0 or Start -> End)
    if (segmentIndex === 0) {
        // We cannot move Start. We must insert a new point P_new to form the dogleg.
        // Start -> P_new -> (P0 or End)
        // If P0 exists, P0 moves. If no P0, we create P_new2 near End?
        // Standard Schematic Dragging:
        // If I drag the wire coming out of a pin, I extend a perpendicular segment.
        
        if (newPoints.length === 0) {
            // Dragging a single straight wire Start -> End.
            // Becomes Start -> P1 -> P2 -> End
            // P1 and P2 form the bridge.
            const p1 = { x: endpoints.start.x + moveX, y: endpoints.start.y + moveY };
            const p2 = { x: endpoints.end.x + moveX, y: endpoints.end.y + moveY };
            
            // If movement is orthogonal to the line, we need 2 points.
            // If parallel, it just slides? (Not possible if orientation locked)
            return [p1, p2];
        } else {
            // Start -> P0 ...
            // We move P0. Start is fixed. 
            // So we need to insert a point at P0's OLD location? No.
            // Standard behavior: The segment moves. So P0 moves.
            // Start is fixed. So we need a new point at Start's location (plus delta?) NO.
            // We insert a new point `P_new` which creates the "step" from Start.
            
            // Current P0
            const p0 = newPoints[0];
            const p0_new = { x: p0.x + moveX, y: p0.y + moveY };
            
            // Insert dogleg near start
            // Logic: Start -> [Dogleg] -> P0_moved ...
            // If we move horizontal segment vertically:
            // S (0,0) -> P0 (10,0). Move to y=10.
            // Result: S(0,0) -> (0,10) -> (10,10).
            
            // Check orientation of S->P0.
            // If Horizontal: S.y == P0.y. We move Y.
            // New path must go S -> (S.x, newY) -> (P0.x, newY) ...
            
            // Modify P0
            newPoints[0] = p0_new;
            
            // Insert Dogleg at start
            // Dogleg is (Start.x, newY) if horizontal move
            // Dogleg is (newX, Start.y) if vertical move
            let dogleg = { x: 0, y: 0 };
            if (orientation === 'horizontal') {
                dogleg = { x: endpoints.start.x, y: p0_new.y };
            } else {
                dogleg = { x: p0_new.x, y: endpoints.start.y };
            }
            newPoints.unshift(dogleg);
        }
    } 
    // Case 2: Dragging LAST segment (Pn -> End)
    else if (segmentIndex === (newPoints.length)) {
        // P_last -> End.
        // We move P_last. End is fixed.
        // Same dogleg logic but at the end.
        const pLastIdx = newPoints.length - 1;
        const pLast = newPoints[pLastIdx];
        const pLast_new = { x: pLast.x + moveX, y: pLast.y + moveY };
        
        newPoints[pLastIdx] = pLast_new;
        
        let dogleg = { x: 0, y: 0 };
        if (orientation === 'horizontal') {
            dogleg = { x: endpoints.end.x, y: pLast_new.y };
        } else {
            dogleg = { x: pLast_new.x, y: endpoints.end.y };
        }
        newPoints.push(dogleg);
    } 
    // Case 3: Middle Segment (Pi -> Pi+1)
    else {
        // Simply move both points
        // Intermediate array indices are segmentIndex-1 and segmentIndex
        const idx1 = segmentIndex - 1;
        const idx2 = segmentIndex;
        
        newPoints[idx1] = { x: newPoints[idx1].x + moveX, y: newPoints[idx1].y + moveY };
        newPoints[idx2] = { x: newPoints[idx2].x + moveX, y: newPoints[idx2].y + moveY };
    }

    return newPoints;
};
