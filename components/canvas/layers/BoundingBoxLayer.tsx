import React from 'react';
import { CircuitComponent, ComponentDefinition } from '../../../types';
import { GRID_SIZE } from '../../../constants';
import { calculatePortPosition, getPortDirection } from '../../../services/circuitUtils';

interface BoundingBoxLayerProps {
    components: CircuitComponent[];
    definitions: ComponentDefinition[];
    show: boolean;
}

export const BoundingBoxLayer: React.FC<BoundingBoxLayerProps> = ({ components, definitions, show }) => {
    if (!show) return null;

    return (
        <g className="bounding-boxes pointer-events-none">
            {components.map(comp => {
                const def = definitions.find(d => d.type === comp.definitionType);
                if (!def) return null;

                // Calculate Bounding Box from Ports (Same logic as auto-wiring)
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                let hasPorts = false;

                def.ports.forEach(port => {
                    const pos = calculatePortPosition(comp, port.id, definitions);
                    if (pos) {
                        hasPorts = true;
                        minX = Math.min(minX, pos.x);
                        maxX = Math.max(maxX, pos.x);
                        minY = Math.min(minY, pos.y);
                        maxY = Math.max(maxY, pos.y);
                    }
                });

                if (!hasPorts) return null;

                // Convert to Grid Units
                let width, height, x, y;
                const PADDING = 1; // 1 Grid Unit Padding

                if (def.ports.length === 1) {
                    const portId = def.ports[0].id;
                    const portDir = getPortDirection(comp, portId, definitions);
                    
                    // Shift center away from port direction by 2.5 grid units (50px)
                    // This places the obstacle at Grid Y+2 relative to port (Grid Y).
                    // The buffer (size 1) will cover Grid Y+1 (Component Body).
                    // This leaves Grid Y (Port) completely free of buffer, allowing side access.
                    const cx = minX - (portDir.x * 2.5 * GRID_SIZE);
                    const cy = minY - (portDir.y * 2.5 * GRID_SIZE);
                    
                    const size = GRID_SIZE * 1.5; 
                    const halfSize = size / 2;
                    
                    const gx1 = Math.floor((cx - halfSize) / GRID_SIZE);
                    const gx2 = Math.ceil((cx + halfSize) / GRID_SIZE);
                    const gy1 = Math.floor((cy - halfSize) / GRID_SIZE);
                    const gy2 = Math.ceil((cy + halfSize) / GRID_SIZE);
                    
                    const localPadding = 0;
                    x = gx1 - localPadding;
                    y = gy1 - localPadding;
                    width = (gx2 - gx1) + (localPadding * 2);
                    height = (gy2 - gy1) + (localPadding * 2);
                } else if (def.ports.length === 2) {
                    // 2-port component (Resistor, Capacitor, etc)
                    const isHorizontal = (maxX - minX) > (maxY - minY);
                    
                    let bodyMinX = minX;
                    let bodyMaxX = maxX;
                    let bodyMinY = minY;
                    let bodyMaxY = maxY;

                    const INNER_PADDING = GRID_SIZE / 2; 
                    const THICKNESS = GRID_SIZE / 2;     

                    if (isHorizontal) {
                        bodyMinX += INNER_PADDING;
                        bodyMaxX -= INNER_PADDING;
                        const cy = (minY + maxY) / 2;
                        bodyMinY = cy - THICKNESS;
                        bodyMaxY = cy + THICKNESS;
                    } else {
                        bodyMinY += INNER_PADDING;
                        bodyMaxY -= INNER_PADDING;
                        const cx = (minX + maxX) / 2;
                        bodyMinX = cx - THICKNESS;
                        bodyMaxX = cx + THICKNESS;
                    }

                    const gx1 = Math.ceil(bodyMinX / GRID_SIZE);
                    const gx2 = Math.floor(bodyMaxX / GRID_SIZE);
                    const gy1 = Math.ceil(bodyMinY / GRID_SIZE);
                    const gy2 = Math.floor(bodyMaxY / GRID_SIZE);

                    // Render centered on the nodes
                    // Node N is at N*GRID_SIZE. 
                    // We want to draw a box representing the node's domain.
                    // Assuming domain is [N-0.5, N+0.5] * GRID_SIZE.
                    
                    const widthNodes = Math.max(0, gx2 - gx1 + 1);
                    const heightNodes = Math.max(0, gy2 - gy1 + 1);
                    
                    if (widthNodes === 0 || heightNodes === 0) return null;

                    // Start at (gx1 - 0.5) * GRID_SIZE
                    x = (gx1 - 0.5); 
                    y = (gy1 - 0.5);
                    width = widthNodes;
                    height = heightNodes;
                } else {
                    // Complex component - use bounding box
                    const gx1 = Math.floor(minX / GRID_SIZE);
                    const gx2 = Math.ceil(maxX / GRID_SIZE);
                    const gy1 = Math.floor(minY / GRID_SIZE);
                    const gy2 = Math.ceil(maxY / GRID_SIZE);
                    
                    x = gx1 - PADDING;
                    y = gy1 - PADDING;
                    width = (gx2 - gx1) + (PADDING * 2);
                    height = (gy2 - gy1) + (PADDING * 2);
                }

                // Convert back to pixels for rendering
                const px = x * GRID_SIZE;
                const py = y * GRID_SIZE;
                const pw = width * GRID_SIZE;
                const ph = height * GRID_SIZE;

                return (
                    <g key={`bbox-group-${comp.id}`}>
                        {/* Bounding Box */}
                        <rect
                            x={px}
                            y={py}
                            width={pw}
                            height={ph}
                            fill="rgba(255, 0, 0, 0.1)"
                            stroke="rgba(255, 0, 0, 0.5)"
                            strokeWidth={1}
                            strokeDasharray="4 2"
                        />
                        
                        {/* Projected Pins */}
                        {def.ports.map(port => {
                            const actualPos = calculatePortPosition(comp, port.id, definitions);
                            if (!actualPos) return null;

                            const dir = getPortDirection(comp, port.id, definitions);
                            const projectedPos = {
                                x: actualPos.x + (dir.x * GRID_SIZE),
                                y: actualPos.y + (dir.y * GRID_SIZE)
                            };

                            return (
                                <g key={`proj-${comp.id}-${port.id}`}>
                                    {/* Connection Line */}
                                    <line 
                                        x1={actualPos.x} 
                                        y1={actualPos.y} 
                                        x2={projectedPos.x} 
                                        y2={projectedPos.y} 
                                        stroke="#10b981" 
                                        strokeWidth={1} 
                                        strokeDasharray="2 2"
                                    />
                                    {/* Projected Point Marker */}
                                    <circle 
                                        cx={projectedPos.x} 
                                        cy={projectedPos.y} 
                                        r={3} 
                                        fill="#10b981" 
                                        stroke="white"
                                        strokeWidth={1}
                                    />
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </g>
    );
};
