
import { useState, useCallback } from 'react';
import { Wire, XY } from '../types';
import { hitTestWire, calculateWireDrag } from '../services/wire-manipulation';

interface DragState {
    wireId: string;
    segmentIndex: number;
    orientation: 'horizontal' | 'vertical';
    startMouse: XY;
    startEndpoints: { start: XY, end: XY }; // Cache endpoints at start of drag
    initialPoints: XY[]; // Cache initial points to apply delta relative to start
}

export const useWireDrag = (
    wires: Wire[],
    updateWire: (id: string, points: XY[]) => void,
    screenToWorld: (x: number, y: number) => XY,
    getPortPosition: (compId: string, portId: string) => XY | null
) => {
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [hoveredSegment, setHoveredSegment] = useState<{ wireId: string, orientation: string } | null>(null);

    const resolveWire = useCallback((wire: Wire) => {
        const start = getPortPosition(wire.sourceComponentId, wire.sourcePortId);
        const end = getPortPosition(wire.destComponentId, wire.destPortId);
        if (start && end) return { start, end };
        return null;
    }, [getPortPosition]);

    const checkWireHit = useCallback((x: number, y: number) => {
        return hitTestWire(wires, x, y, resolveWire);
    }, [wires, resolveWire]);

    const startWireDrag = useCallback((x: number, y: number, screenX: number, screenY: number): string | null => {
        const hit = hitTestWire(wires, x, y, resolveWire);
        if (hit) {
            const wire = wires.find(w => w.id === hit.wireId);
            const eps = wire ? resolveWire(wire) : null;
            
            if (eps && wire) {
                setDragState({
                    wireId: hit.wireId,
                    segmentIndex: hit.segmentIndex,
                    orientation: hit.orientation,
                    startMouse: { x: screenX, y: screenY },
                    startEndpoints: eps,
                    // Deep copy points to prevent reference mutation issues
                    initialPoints: wire.points ? wire.points.map(p => ({ ...p })) : []
                });
                return hit.wireId;
            }
        }
        return null;
    }, [wires, resolveWire]);

    const updateWireDrag = useCallback((screenX: number, screenY: number) => {
        if (!dragState) return;

        const wire = wires.find(w => w.id === dragState.wireId);
        if (!wire) return;

        const startWorld = screenToWorld(dragState.startMouse.x, dragState.startMouse.y);
        const currentWorld = screenToWorld(screenX, screenY);
        
        const delta = {
            x: currentWorld.x - startWorld.x,
            y: currentWorld.y - startWorld.y
        };

        // Use a mock wire with the INITIAL points so delta is applied correctly relative to start state
        const baseWire: Wire = {
            ...wire,
            points: dragState.initialPoints
        };

        const newPoints = calculateWireDrag(
            baseWire, 
            dragState.segmentIndex, 
            delta, 
            dragState.orientation,
            dragState.startEndpoints
        );
        
        updateWire(wire.id, newPoints);
    }, [dragState, wires, updateWire, screenToWorld]);

    const endWireDrag = useCallback(() => {
        setDragState(null);
    }, []);

    const updateHover = useCallback((x: number, y: number) => {
        if (dragState) return;
        const hit = hitTestWire(wires, x, y, resolveWire);
        if (hit) {
            setHoveredSegment({ wireId: hit.wireId, orientation: hit.orientation });
        } else {
            setHoveredSegment(null);
        }
    }, [wires, dragState, resolveWire]);

    return {
        isDraggingWire: !!dragState,
        hoveredWireSegment: hoveredSegment,
        startWireDrag,
        updateWireDrag,
        endWireDrag,
        updateHover,
        checkWireHit
    };
};
