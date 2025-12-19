
import React from 'react';
import { GraphSeries } from '../../../hooks/useGraphData';

export interface TooltipData {
    xVal: number;
    series: { label: string; color: string; value: number }[];
}

interface GraphTooltipProps {
    tooltipData: TooltipData | null;
    xLabel: string;
    series: GraphSeries[];
}

export const GraphTooltip: React.FC<GraphTooltipProps> = ({ tooltipData, xLabel, series }) => {
    return (
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-xs pointer-events-none z-10 max-w-[200px] overflow-hidden backdrop-blur-sm transition-opacity">
            {tooltipData ? (
                <>
                   <div className="font-mono mb-1 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-900 dark:text-gray-100 truncate">
                       {xLabel}: {tooltipData.xVal.toExponential(4)}
                   </div>
                   {tooltipData.series.map((s, i) => (
                       <div key={i} className="flex items-center gap-2 mb-0.5">
                           <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                           <span className="text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{s.label}:</span>
                           <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                               {s.value.toExponential(4)}
                           </span>
                       </div>
                   ))}
                </>
            ) : (
                <>
                   <div className="font-semibold text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                       <span>Legend</span>
                       <span className="text-[10px] font-normal opacity-70">Scroll to Zoom</span>
                   </div>
                    {series.map((s, i) => (
                       <div key={i} className="flex items-center gap-2 mb-0.5">
                           <div className="w-3 h-1 shrink-0" style={{ backgroundColor: s.color }} />
                           <span className="text-gray-700 dark:text-gray-300 truncate">{s.label}</span>
                       </div>
                   ))}
                </>
            )}
        </div>
    );
};
