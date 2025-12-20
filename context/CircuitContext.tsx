
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { ToolType, ViewportTransform } from '../types';
import { CircuitContextType } from './circuit/circuitTypes';

import { useCircuitState } from './circuit/hooks/useCircuitState';
import { useCircuitSimulation } from './circuit/hooks/useCircuitSimulation';
import { useCircuitActions } from './circuit/hooks/useCircuitActions';
import { useCircuitPersistence } from './circuit/hooks/useCircuitPersistence';
import { useCircuitAutoCheck } from './circuit/hooks/useCircuitAutoCheck';

const CircuitContext = createContext<CircuitContextType | undefined>(undefined);

export const CircuitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State
  const state = useCircuitState();
  
  // 2. Simulation State
  const simulation = useCircuitSimulation();

  // Canvas Ref for Capture Tools
  const canvasRef = useRef<SVGSVGElement>(null);

  // 3. Actions (CRUD + Logic)
  const actions = useCircuitActions({
      components: state.components,
      setComponents: state.setComponents,
      wires: state.wires,
      setWires: state.setWires,
      grids: state.grids,
      setGrids: state.setGrids,
      selectedComponentIds: state.selectedComponentIds,
      setSelectedComponentIds: state.setSelectedComponentIds,
      selectedWireId: state.selectedWireId,
      setSelectedWireId: state.setSelectedWireId,
      saveSnapshot: state.saveSnapshot,
      customDefinitions: state.customDefinitions,
      setCustomDefinitions: state.setCustomDefinitions,
      setPendingComponent: state.setPendingComponent,
      setActiveTool: state.setActiveTool,
      stopProbing: simulation.stopProbing,
      reports: state.reports,
      setReports: state.setReports
  });

  // Re-instantiate actions with correct callbacks if needed
  const setActiveTool = (tool: ToolType) => {
      state.setActiveTool(tool);
      if (tool !== ToolType.MOVE) state.setPendingComponent(null);
      if (tool !== ToolType.PROBE) simulation.stopProbing();
      if (tool === ToolType.WIRE || tool === ToolType.PROBE) {
          state.setSelectedComponentIds([]);
      }
  };

  // 4. Persistence
  const persistence = useCircuitPersistence({
      components: state.components,
      setComponents: state.setComponents,
      wires: state.wires,
      setWires: state.setWires,
      customDefinitions: state.customDefinitions,
      setCustomDefinitions: state.setCustomDefinitions,
      reports: state.reports,
      setReports: state.setReports,
      setIsLoading: state.setIsLoading,
      clearHistory: state.clearHistory
  });

  // 5. Auto Checker
  const autoCheck = useCircuitAutoCheck(
      state.components,
      state.wires,
      state.customDefinitions,
      simulation.simulationResults && simulation.lastNetlistResult 
          ? { data: simulation.simulationResults, netlistInfo: simulation.lastNetlistResult } 
          : null
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          e.shiftKey ? state.redo() : state.undo();
          return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          state.redo();
          return;
      }

      switch(e.key.toLowerCase()) {
        case 'w': setActiveTool(ToolType.WIRE); break;
        case 'v': setActiveTool(ToolType.MOVE); break;
        case 'escape':
          if (state.activeTool === ToolType.PROBE) simulation.stopProbing();
          else if (state.pendingComponent) state.setPendingComponent(null);
          else if (state.selectedComponentIds.length > 0) actions.selectComponent('', false);
          else setActiveTool(ToolType.MOVE); 
          break;
        case 'm': setActiveTool(ToolType.MOVE); break;
        case 'h':
        case ' ': setActiveTool(ToolType.PAN); break;
        case 'x': 
        case 'delete':
          if (state.activeTool === ToolType.DELETE) actions.removeSelection();
          else if (state.selectedComponentIds.length > 0) actions.removeSelection();
          else setActiveTool(ToolType.DELETE);
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) return;
          actions.rotateSelected();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.activeTool, state.selectedComponentIds, state.pendingComponent, actions, setActiveTool, state.undo, state.redo, simulation.stopProbing]);

  const value: CircuitContextType = {
      // State
      ...state,
      // Simulation
      ...simulation,
      // Actions
      ...actions,
      setActiveTool, 
      // Persistence
      ...persistence,
      // AutoCheck
      ...autoCheck,
      // Refs
      canvasRef
  };

  return (
    <CircuitContext.Provider value={value}>
      {children}
    </CircuitContext.Provider>
  );
};

export const useCircuit = () => {
  const context = useContext(CircuitContext);
  if (!context) throw new Error('useCircuit must be used within a CircuitProvider');
  return context;
};
