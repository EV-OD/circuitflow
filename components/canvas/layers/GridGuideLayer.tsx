
import React from 'react';
import { VirtualGrid } from '../../../types';

interface GridGuideLayerProps {
    grids: VirtualGrid[];
}

export const GridGuideLayer: React.FC<GridGuideLayerProps> = ({ grids }) => {
    if (!grids || grids.length === 0) return null;

    return (
        <g pointerEvents="none">
            {grids.map(grid => (
                <g key={grid.id} transform={`translate(${grid.x}, ${grid.y})`}>
                    {/* Rows */}
                    {Array.from({ length: grid.rows + 1 }).map((_, i) => (
                        <line 
                            key={`r${i}`}
                            x1={0} y1={i * grid.spacing} 
                            x2={grid.cols * grid.spacing} y2={i * grid.spacing}
                            stroke="#3b82f6" 
                            strokeWidth="1" 
                            strokeOpacity="0.2" 
                            strokeDasharray="4 2"
                        />
                    ))}
                    {/* Cols */}
                    {Array.from({ length: grid.cols + 1 }).map((_, i) => (
                        <line 
                            key={`c${i}`}
                            x1={i * grid.spacing} y1={0} 
                            x2={i * grid.spacing} y2={grid.rows * grid.spacing}
                            stroke="#3b82f6" 
                            strokeWidth="1" 
                            strokeOpacity="0.2"
                            strokeDasharray="4 2"
                        />
                    ))}
                    {/* Nodes */}
                    {Array.from({ length: grid.rows + 1 }).map((_, r) => (
                        Array.from({ length: grid.cols + 1 }).map((_, c) => (
                            <circle 
                                key={`n${r}-${c}`}
                                cx={c * grid.spacing} 
                                cy={r * grid.spacing} 
                                r="2" 
                                fill="#3b82f6"
                                fillOpacity="0.3"
                            />
                        ))
                    ))}
                    {/* Label */}
                    <text x={0} y={-10} fontSize="10" fill="#3b82f6" opacity="0.5">AI Grid: {grid.id}</text>
                </g>
            ))}
        </g>
    );
};
