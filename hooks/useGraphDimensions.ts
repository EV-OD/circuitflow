
import { useState, useEffect, RefObject } from 'react';

export const useGraphDimensions = (containerRef: RefObject<HTMLElement | null>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  return dimensions;
};
