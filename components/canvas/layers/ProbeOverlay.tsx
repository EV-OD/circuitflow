
import React from 'react';

interface ProbeOverlayProps {
    start: { x: number, y: number } | null;
    end: { x: number, y: number } | null;
}

export const ProbeOverlay: React.FC<ProbeOverlayProps> = ({ start, end }) => {
    if (!start || !end) return null;
    return (
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" pointerEvents="none" />
    );
};
