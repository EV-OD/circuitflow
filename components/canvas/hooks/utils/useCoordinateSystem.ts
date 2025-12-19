
import { useCallback } from 'react';
import { ViewportTransform, XY } from '../../../../types';

export const useCoordinateSystem = (viewport: ViewportTransform) => {
  const screenToWorld = useCallback((sx: number, sy: number): XY => {
    return {
      x: (sx - viewport.x) / viewport.k,
      y: (sy - viewport.y) / viewport.k
    };
  }, [viewport]);

  return { screenToWorld };
};
