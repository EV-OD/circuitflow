
import React, { useState } from "react";
import { useCircuit } from "../../context/CircuitContext";
import { GraphContextMenu } from "./GraphContextMenu";
import { ToolType } from "../../types";
import { TooltipData } from "../debug/graph/GraphTooltip";
import { normalizeVar } from "../../services/VariableManager/Normalizers";

// Modular Components
import { useGraphPaneData } from "./graph-pane/useGraphPaneData";
import { GraphPaneHeader } from "./graph-pane/GraphPaneHeader";
import { GraphPaneContent } from "./graph-pane/GraphPaneContent";

interface GraphPaneProps {
  paneId: string;
}

export const GraphPane: React.FC<GraphPaneProps> = ({ paneId }) => {
  const {
    graphPanes,
    simulationResults,
    splitGraphPane,
    deleteGraphPane,
    clearGraphPane,
    updateGraphPaneVariables,
    setGraphPaneXAxis,
    startProbing,
    setActiveTool,
  } = useCircuit();

  const pane = graphPanes[paneId];
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const [hoverData, setHoverData] = useState<TooltipData | null>(null);
  const [showCursors, setShowCursors] = useState(false);

  // Determine X Axis
  const xAxisVar = pane.xAxis || simulationResults?.variables[0] || "time";

  // Use Modular Hook for Data Processing
  const { displayData, processedGraphData } = useGraphPaneData(simulationResults, pane, xAxisVar);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleAddVoltage = () => {
    startProbing(paneId, "VOLTAGE");
    setActiveTool(ToolType.PROBE);
  };

  const handleAddCurrent = () => {
    startProbing(paneId, "CURRENT");
    setActiveTool(ToolType.PROBE);
  };

  const removeVariable = (v: string) => {
    const lowerV = normalizeVar(v);
    const newVars = pane.variables.filter(
      (item) => normalizeVar(item) !== lowerV,
    );
    updateGraphPaneVariables(paneId, newVars);
  };

  const addVariable = (v: string) => {
    const lowerV = normalizeVar(v);
    if (!pane.variables.some((item) => normalizeVar(item) === lowerV)) {
      updateGraphPaneVariables(paneId, [...pane.variables, v]);
    }
  };

  return (
    <div
      className="w-full h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 relative group flex flex-col overflow-hidden"
      onContextMenu={handleContextMenu}
    >
      <GraphPaneHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        pane={pane}
        simulationResults={simulationResults}
        xAxisVar={xAxisVar}
        onXAxisChange={(v) => setGraphPaneXAxis(paneId, v)}
        onAddVariable={addVariable}
        onRemoveVariable={removeVariable}
        onAddVoltageProbe={handleAddVoltage}
        onAddCurrentProbe={handleAddCurrent}
        showCursors={showCursors}
        setShowCursors={setShowCursors}
      />

      <GraphPaneContent 
        viewMode={viewMode}
        displayData={displayData}
        processedGraphData={processedGraphData}
        xAxisVar={xAxisVar}
        pane={pane}
        hoverData={hoverData}
        setHoverData={setHoverData}
        onRemoveVariable={removeVariable}
        showCursors={showCursors}
      />

      {/* Context Menu */}
      {contextMenu && (
        <GraphContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onSplitHorizontal={() => {
            splitGraphPane(paneId, "horizontal");
            setContextMenu(null);
          }}
          onSplitVertical={() => {
            splitGraphPane(paneId, "vertical");
            setContextMenu(null);
          }}
          onClear={() => {
            clearGraphPane(paneId);
            setContextMenu(null);
          }}
          onDelete={() => {
            deleteGraphPane(paneId);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};
