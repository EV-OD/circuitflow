
import React from 'react';
import { GRID_SIZE } from '../../../constants';
import { ViewportTransform } from '../../../types';

interface GridLayerProps {
  viewport: ViewportTransform;
  isDarkMode: boolean;
}

export const GridLayer: React.FC<GridLayerProps> = ({ viewport, isDarkMode }) => {
  return (
    <>
      <defs>
        <pattern id="grid" width={GRID_SIZE * viewport.k} height={GRID_SIZE * viewport.k} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID_SIZE * viewport.k} 0 L 0 0 0 ${GRID_SIZE * viewport.k}`} fill="none" stroke={isDarkMode ? "#2d3748" : "#e5e7eb"} strokeWidth="1" />
        </pattern>
      </defs>
      <rect id="circuit-grid-background" x={-viewport.x/viewport.k} y={-viewport.y/viewport.k} width="50000" height="50000" fill="url(#grid)" transform="translate(-25000,-25000)" />
    </>
  );
};
