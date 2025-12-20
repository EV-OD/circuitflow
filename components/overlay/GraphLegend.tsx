
import React, { useMemo } from 'react';
import { X, Eye } from 'lucide-react';
import { GraphSeries } from '../../hooks/useGraphData';
import { TooltipData } from '../debug/graph/GraphTooltip';
import { calculateFrequency, formatFrequency } from '../../services/signalAnalysis';

interface GraphLegendProps {
    series: GraphSeries[];
    tooltipData: TooltipData | null;
    onRemove: (label: string) => void;
    xAxisLabel?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ series, tooltipData, onRemove, xAxisLabel }) => {
    const showFrequency = useMemo(() => {
        if (!xAxisLabel) return true; 
        const label = xAxisLabel.toLowerCase();
        // Show frequency calculation only if X-axis is Time
        return label.includes('time') || label === 't' || label === 's';
    }, [xAxisLabel]);

    const frequencies = useMemo(() => {
        if (!showFrequency) return [];
        return series.map(s => calculateFrequency(s.values));
    }, [series, showFrequency]);

    return (
        <div className="w-48 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 uppercase">
                Traces ({series.length})
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {series.map((s, i) => {
                    const activeVal = tooltipData?.series.find(ts => ts.label === s.label)?.value;
                    const frequency = showFrequency ? frequencies[i] : null;
                    
                    return (
                        <div key={i} className="group flex flex-col p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={s.label}>
                                        {s.label}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => onRemove(s.label)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            
                            {/* Value Display */}
                            <div className="pl-4 font-mono text-xs">
                                {activeVal !== undefined ? (
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {activeVal.toExponential(3)}
                                    </span>
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-600 text-[10px]">
                                        --
                                    </span>
                                )}
                            </div>

                            {/* Frequency Display */}
                            {showFrequency && (
                                <div className="pl-4 mt-1 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <span className="opacity-70">f:</span>
                                    <span>{formatFrequency(frequency)}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {series.length === 0 && (
                     <div className="text-center py-4 text-xs text-gray-400 italic">
                         No active traces.
                     </div>
                )}
            </div>
        </div>
    );
};
