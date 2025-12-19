
import React from 'react';
import { Activity, Table, X } from 'lucide-react';
import { GraphAxisControl } from '../GraphAxisControl';
import { SimulationData, GraphPane, ToolType } from '../../../types';
import { COLORS } from '../../../hooks/useGraphData';
import { useCircuit } from '../../../context/CircuitContext';

interface GraphPaneHeaderProps {
    viewMode: "graph" | "table";
    setViewMode: (mode: "graph" | "table") => void;
    pane: GraphPane;
    simulationResults: SimulationData | null;
    xAxisVar: string;
    onXAxisChange: (v: string) => void;
    onAddVariable: (v: string) => void;
    onRemoveVariable: (v: string) => void;
    onAddVoltageProbe: () => void;
    onAddCurrentProbe: () => void;
}

export const GraphPaneHeader: React.FC<GraphPaneHeaderProps> = ({
    viewMode,
    setViewMode,
    pane,
    simulationResults,
    xAxisVar,
    onXAxisChange,
    onAddVariable,
    onRemoveVariable,
    onAddVoltageProbe,
    onAddCurrentProbe
}) => {
    const { startProbing, setActiveTool } = useCircuit();
    const getColor = (idx: number) => COLORS[idx % COLORS.length];

    const handleAddComponentProbe = () => {
        startProbing(pane.id, 'COMPONENT_DETAILS');
        setActiveTool(ToolType.PROBE);
    };

    return (
        <div className="flex items-center justify-between p-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0 gap-2 overflow-hidden h-10">
            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                {/* X Axis Selector */}
                {viewMode === "graph" && simulationResults && (
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase select-none">
                            X
                        </span>
                        <GraphAxisControl
                            type="X"
                            currentLabel={xAxisVar}
                            variables={simulationResults.variables}
                            onSelectVariable={onXAxisChange}
                        />
                    </div>
                )}

                {/* Separator */}
                {viewMode === "graph" && (
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 shrink-0" />
                )}

                {/* Y Axis Horizontal List */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 mask-linear-fade-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0 select-none">
                        Y
                    </span>

                    {pane.variables.map((v, i) => (
                        <div
                            key={v}
                            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full text-xs whitespace-nowrap group shrink-0 transition-colors hover:bg-white dark:hover:bg-gray-700"
                        >
                            <div
                                className="w-2 h-2 rounded-full shadow-sm"
                                style={{ background: getColor(i) }}
                            />
                            <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">
                                {v}
                            </span>
                            <button
                                onClick={() => onRemoveVariable(v)}
                                className="ml-1 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}

                    {/* Add Trace Button (Icon Only) */}
                    {simulationResults && (
                        <div className="shrink-0">
                            <GraphAxisControl
                                type="Y"
                                currentLabel="+"
                                minimal={true}
                                variables={simulationResults.variables}
                                activeVariables={pane.variables}
                                onSelectVariable={onAddVariable}
                                onAddVoltageProbe={onAddVoltageProbe}
                                onAddCurrentProbe={onAddCurrentProbe}
                                onAddComponentProbe={handleAddComponentProbe}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded p-0.5 shrink-0">
                <button
                    onClick={() => setViewMode("graph")}
                    className={`p-1 rounded transition-colors ${
                        viewMode === "graph"
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                    title="Graph View"
                >
                    <Activity className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => setViewMode("table")}
                    className={`p-1 rounded transition-colors ${
                        viewMode === "table"
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                    title="Table View"
                >
                    <Table className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
