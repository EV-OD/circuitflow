
import React from 'react';
import { CircuitComponent, ProbeMode } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { useCircuit } from '../../../context/CircuitContext';

interface ProbeHighlightLayerProps {
    components: CircuitComponent[];
    hoveredObject: { type: 'component' | 'node', id: string, subId?: string } | null;
    probeMode: ProbeMode;
    probeStart: { x: number, y: number } | null;
    probeEnd: { x: number, y: number } | null;
}

export const ProbeHighlightLayer: React.FC<ProbeHighlightLayerProps> = ({
    components,
    hoveredObject,
    probeMode,
    probeStart,
    probeEnd
}) => {
    const { customDefinitions } = useCircuit();
    
    if (!probeMode) return null;

    const getPortPos = (c: CircuitComponent, portId: string) => {
        const def = COMPONENT_LIBRARY.find(d => d.type === c.definitionType) || 
                    customDefinitions.find(d => d.type === c.definitionType);
        
        const p = def?.ports.find(pt => pt.id === portId);
        if (!p) return null;
        const rad = (c.rotation * Math.PI) / 180;
        return {
            x: c.x + (p.x * Math.cos(rad) - p.y * Math.sin(rad)),
            y: c.y + (p.x * Math.sin(rad) + p.y * Math.cos(rad))
        };
    };

    return (
        <g pointerEvents="none">
            {/* Highlight Hovered Target */}
            {hoveredObject && (
                <>
                    {hoveredObject.type === 'node' && probeMode === 'VOLTAGE' && (
                        <circle 
                            cx={(() => {
                                const c = components.find(cmp => cmp.id === hoveredObject.id);
                                const p = getPortPos(c!, hoveredObject.subId!);
                                return p?.x;
                            })()}
                            cy={(() => {
                                const c = components.find(cmp => cmp.id === hoveredObject.id);
                                const p = getPortPos(c!, hoveredObject.subId!);
                                return p?.y;
                            })()}
                            r="8"
                            fill="rgba(37, 99, 235, 0.3)"
                            stroke="#2563eb"
                            strokeWidth="2"
                        />
                    )}
                    {hoveredObject.type === 'component' && probeMode === 'CURRENT' && (
                        <rect 
                            x={(() => {
                                const c = components.find(cmp => cmp.id === hoveredObject.id);
                                return (c?.x || 0) - 30;
                            })()}
                            y={(() => {
                                const c = components.find(cmp => cmp.id === hoveredObject.id);
                                return (c?.y || 0) - 30;
                            })()}
                            width="60"
                            height="60"
                            rx="4"
                            fill="rgba(245, 158, 11, 0.2)"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                        />
                    )}
                </>
            )}

            {/* Differential Probe Line */}
            {probeStart && probeEnd && probeMode === 'VOLTAGE' && (
                <g>
                    <line 
                        x1={probeStart.x} y1={probeStart.y} 
                        x2={probeEnd.x} y2={probeEnd.y} 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        strokeDasharray="4 2" 
                    />
                    <circle cx={probeStart.x} cy={probeStart.y} r="4" fill="#ef4444" />
                    <circle cx={probeEnd.x} cy={probeEnd.y} r="4" fill="#ef4444" />
                    <text x={probeEnd.x + 10} y={probeEnd.y} fill="#ef4444" fontSize="12" fontWeight="bold">Ref?</text>
                </g>
            )}
        </g>
    );
};
