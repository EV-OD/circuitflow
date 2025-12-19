
import React from 'react';
import { SimulationGraph } from '../../debug/SimulationGraph';
import { SimulationResults } from '../../debug/SimulationResults';
import { GraphLegend } from '../GraphLegend';
import { SimulationData, GraphPane } from '../../../types';
import { ProcessedGraphData } from '../../../hooks/useGraphData';
import { TooltipData } from '../../debug/graph/GraphTooltip';

interface GraphPaneContentProps {
    viewMode: "graph" | "table";
    displayData: SimulationData | null;
    processedGraphData: ProcessedGraphData | null;
    xAxisVar: string;
    pane: GraphPane;
    hoverData: TooltipData | null;
    setHoverData: (data: TooltipData | null) => void;
    onRemoveVariable: (v: string) => void;
}

export const GraphPaneContent: React.FC<GraphPaneContentProps> = ({
    viewMode,
    displayData,
    processedGraphData,
    xAxisVar,
    pane,
    hoverData,
    setHoverData,
    onRemoveVariable
}) => {
    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Center Area (Graph or Table) */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === "graph" ? (
                    displayData ? (
                        <SimulationGraph
                            data={displayData}
                            xAxisVariable={xAxisVar}
                            onHover={setHoverData}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs select-none">
                            {pane.variables.length === 0 ? (
                                <>
                                    <p className="flex items-center gap-1">
                                        No traces selected.
                                    </p>
                                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                        Click + to add variables
                                    </p>
                                </>
                            ) : (
                                <div className="text-center">
                                    <p>Loading Graph Data...</p>
                                    <p className="text-[10px] text-red-400 mt-2">
                                        Note: Check console if variables are missing.
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <SimulationResults data={displayData} compact={true} />
                )}
            </div>

            {/* Right Side Legend (Only visible in Graph Mode and if data exists) */}
            {viewMode === "graph" && processedGraphData && (
                <GraphLegend
                    series={processedGraphData.series}
                    tooltipData={hoverData}
                    onRemove={onRemoveVariable}
                />
            )}
        </div>
    );
};
