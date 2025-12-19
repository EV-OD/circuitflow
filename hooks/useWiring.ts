import { useState, useCallback } from 'react';
import { XY, Wire } from '../types';

interface WiringStart {
    compId: string;
    portId: string;
    x: number;
    y: number;
}

export const useWiring = (
    addWire: (wire: Omit<Wire, 'id'>) => void,
    getPortPosition: (compId: string, portId: string) => XY | null
) => {
    const [wiringStart, setWiringStart] = useState<WiringStart | null>(null);
    const [wirePoints, setWirePoints] = useState<XY[]>([]);

    const getProjectedPoint = useCallback((from: XY, to: XY): XY => {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        if (dx > dy) {
            return { x: to.x, y: from.y }; // Horizontal
        } else {
            return { x: from.x, y: to.y }; // Vertical
        }
    }, []);

    const startWiring = (compId: string, portId: string, pos: XY) => {
        setWiringStart({ compId, portId, x: pos.x, y: pos.y });
        setWirePoints([]);
    };

    const addSegment = (mousePos: XY) => {
        if (!wiringStart) return;
        const lastP = wirePoints.length > 0 ? wirePoints[wirePoints.length - 1] : wiringStart;
        const projected = getProjectedPoint(lastP, mousePos);
        setWirePoints(prev => [...prev, projected]);
    };

    const completeWiring = (compId: string, portId: string) => {
        if (!wiringStart) return;

        // If clicking same port or invalid, cancel
        if (wiringStart.compId === compId && wiringStart.portId === portId) {
             cancelWiring();
             return;
        }

        const destPos = getPortPosition(compId, portId);
        if (!destPos) {
            cancelWiring();
            return;
        }

        const lastP = wirePoints.length > 0 ? wirePoints[wirePoints.length - 1] : wiringStart;
        const finalPoints = [...wirePoints];
        
        // Auto-complete: If not aligned with destination, add orthogonal elbow
        if (lastP.x !== destPos.x && lastP.y !== destPos.y) {
            const elbow = getProjectedPoint(lastP, destPos);
            finalPoints.push(elbow);
        }

        addWire({
            sourceComponentId: wiringStart.compId,
            sourcePortId: wiringStart.portId,
            destComponentId: compId,
            destPortId: portId,
            points: finalPoints
        });

        cancelWiring();
    };

    const cancelWiring = useCallback(() => {
        setWiringStart(null);
        setWirePoints([]);
    }, []);

    return {
        wiringStart,
        wirePoints,
        startWiring,
        addSegment,
        completeWiring,
        cancelWiring,
        getProjectedPoint
    };
};