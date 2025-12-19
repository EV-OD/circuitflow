
import React, { useRef, useCallback } from 'react';
import { SimulationData } from '../../types';
import { useCircuit } from '../../context/CircuitContext';
import { useGraphDimensions } from '../../hooks/useGraphDimensions';
import { useGraphData } from '../../hooks/useGraphData';
import { GraphCanvas } from './graph/GraphCanvas';
import { TooltipData } from './graph/GraphTooltip';

interface SimulationGraphProps {
  data: SimulationData;
  xAxisVariable?: string; // Optional override
  onHover?: (data: TooltipData | null) => void;
}

export const SimulationGraph: React.FC<SimulationGraphProps> = ({ data, xAxisVariable, onHover }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useCircuit();
  
  const dimensions = useGraphDimensions(containerRef);
  const processedData = useGraphData(data, xAxisVariable);

  // Memoize handleHover to prevent recreating it on every render.
  // We only want to recreate it if the external `onHover` prop changes.
  const handleHover = useCallback((tData: TooltipData | null) => {
      if (onHover) onHover(tData);
  }, [onHover]);

  if (!processedData || dimensions.width === 0) {
      return (
          <div ref={containerRef} className="w-full h-full flex items-center justify-center text-gray-400">
              {(!data || data.data.length === 0) ? "No data points." : "Loading Graph..."}
          </div>
      );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-white dark:bg-gray-900 select-none overflow-hidden group">
        <GraphCanvas 
            dimensions={dimensions}
            data={processedData}
            isDarkMode={isDarkMode}
            onHover={handleHover}
        />
    </div>
  );
};
