import React from 'react';
import { XY } from '../../types';

interface WiringOverlayProps {
    wiringStart: { x: number, y: number } | null;
    wirePoints: XY[];
    mouseWorldPos: XY;
    getProjectedPoint: (from: XY, to: XY) => XY;
}

export const WiringOverlay: React.FC<WiringOverlayProps> = ({ 
    wiringStart, 
    wirePoints, 
    mouseWorldPos, 
    getProjectedPoint 
}) => {
    // Render Guides only
    if (!wiringStart) {
        return (
            <g className="pointer-events-none">
                <line 
                    x1={-50000} x2={50000} 
                    y1={mouseWorldPos.y} y2={mouseWorldPos.y}
                    stroke="#ef4444" 
                    strokeWidth="1" 
                    strokeOpacity="0.4"
                    strokeDasharray="4 4"
                />
                <line 
                    y1={-50000} y2={50000} 
                    x1={mouseWorldPos.x} x2={mouseWorldPos.x}
                    stroke="#ef4444" 
                    strokeWidth="1" 
                    strokeOpacity="0.4"
                    strokeDasharray="4 4"
                />
            </g>
        );
    }

    // Active Wire Drawing
    const startP = wiringStart;
    const lastP = wirePoints.length > 0 ? wirePoints[wirePoints.length - 1] : startP;
    // Project to mouse
    const projected = getProjectedPoint(lastP, mouseWorldPos);
    
    // Construct points string for committed segments
    let pts = `${startP.x},${startP.y}`;
    wirePoints.forEach(p => pts += ` ${p.x},${p.y}`);
    
    const activeSegmentCoords = {
        x1: lastP.x, y1: lastP.y,
        x2: projected.x, y2: projected.y
    };

    return (
        <g className="pointer-events-none">
             {/* Guides */}
            <line 
                x1={-50000} x2={50000} 
                y1={mouseWorldPos.y} y2={mouseWorldPos.y}
                stroke="#ef4444" 
                strokeWidth="1" 
                strokeOpacity="0.4"
                strokeDasharray="4 4"
            />
            <line 
                y1={-50000} y2={50000} 
                x1={mouseWorldPos.x} x2={mouseWorldPos.x}
                stroke="#ef4444" 
                strokeWidth="1" 
                strokeOpacity="0.4"
                strokeDasharray="4 4"
            />

            {/* Committed segments */}
            <polyline 
            points={pts}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeOpacity="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            />
            
            {/* Active segment (Rubber band) */}
            <line 
                x1={activeSegmentCoords.x1} 
                y1={activeSegmentCoords.y1} 
                x2={activeSegmentCoords.x2} 
                y2={activeSegmentCoords.y2} 
                stroke="#2563eb"
                strokeWidth="3"
                strokeDasharray="4 2"
            />
            {/* Endpoint marker at cursor projection */}
            <circle cx={activeSegmentCoords.x2} cy={activeSegmentCoords.y2} r="3" fill="#2563eb" />
        </g>
    );
};