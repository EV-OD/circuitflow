import React, { useState, useCallback } from 'react';
import { ViewportTransform, XY } from '../types';

export const usePan = (
  viewport: ViewportTransform,
  setViewport: (v: ViewportTransform) => void
) => {
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<XY>({ x: 0, y: 0 });

  const startPan = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const updatePan = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    setViewport({ 
        ...viewport, 
        x: viewport.x + dx, 
        y: viewport.y + dy 
    });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isPanning, lastMousePos, viewport, setViewport]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  return { isPanning, startPan, updatePan, endPan };
};