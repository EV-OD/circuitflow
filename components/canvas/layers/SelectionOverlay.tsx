
import React from 'react';
import { XY, ViewportTransform } from '../../../types';

interface SelectionOverlayProps {
    start: XY | null;
    end: XY | null;
    viewport: ViewportTransform;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ start, end, viewport }) => {
  if (!start || !end) return null;

  return (
       <rect 
            x={Math.min(start.x, end.x)} 
            y={Math.min(start.y, end.y)} 
            width={Math.abs(end.x - start.x)} 
            height={Math.abs(end.y - start.y)} 
            fill="rgba(59, 130, 246, 0.1)" 
            stroke="rgba(59, 130, 246, 0.5)" 
            strokeWidth={1 / viewport.k} 
            pointerEvents="none" 
        />
  );
};
