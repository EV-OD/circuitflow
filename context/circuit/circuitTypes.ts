
import React from 'react';
import { 
  ToolType, 
  CircuitComponent, 
  Wire, 
  ViewportTransform, 
  SimulationConfig, 
  SimulationData, 
  NetlistResult, 
  GraphLayout, 
  GraphPane, 
  ProbeMode, 
  ComponentDefinition,
  VirtualGrid,
  ComponentProbeTarget,
  CircuitReport
} from '../../types';
import { DesignIssue } from '../../services/auto-checker/types';

export interface CircuitContextType {
  // State
  components: CircuitComponent[];
  wires: Wire[];
  grids: VirtualGrid[];
  reports: CircuitReport[]; 
  selectedComponentIds: string[];
  selectedWireId: string | null;
  activeTool: ToolType;
  viewport: ViewportTransform;
  isDragging: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  simulationConfig: SimulationConfig | null;
  simulationResults: SimulationData | null;
  lastNetlistResult: NetlistResult | null;
  
  // UI State
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (isOpen: boolean) => void;
  isLabOpen: boolean; 
  setIsLabOpen: (isOpen: boolean) => void; 
  showBoundingBoxes: boolean;
  setShowBoundingBoxes: (show: boolean) => void;
  
  // Library State
  customDefinitions: ComponentDefinition[];

  // Ghost / Pending Component State
  pendingComponent: { type: string } | null;
  setPendingComponent: (comp: { type: string } | null) => void;

  // Graph Window State
  isSimOverlayOpen: boolean;
  graphLayout: GraphLayout;
  graphPanes: Record<string, GraphPane>;
  probingPaneId: string | null;
  probeMode: ProbeMode;
  detailedProbeTarget: ComponentProbeTarget | null;
  
  // Auto Check State
  isAutoCheckEnabled: boolean;
  setIsAutoCheckEnabled: (enabled: boolean) => void;
  currentIssues: DesignIssue[];
  notifications: (DesignIssue & { uniqueId: string })[];
  runManualCheck: () => void;

  // Refs
  canvasRef: React.RefObject<SVGSVGElement>;

  // Actions
  setViewport: React.Dispatch<React.SetStateAction<ViewportTransform>>;
  setActiveTool: (t: ToolType) => void;
  addComponent: (type: string, x: number, y: number) => CircuitComponent | null;
  addGrid: (grid: VirtualGrid) => void;
  removeGrid: (id: string) => void;
  addReport: (report: CircuitReport) => void; 
  deleteReport: (id: string) => void; 
  registerComponent: (def: ComponentDefinition) => void; 
  updateComponent: (id: string, updates: Partial<CircuitComponent>) => void;
  updateComponents: (updates: { id: string, updates: Partial<CircuitComponent> }[]) => void;
  deleteComponent: (id: string) => void;
  deleteWire: (id: string) => void;
  removeSelection: () => void;
  selectComponent: (id: string, multi: boolean) => void;
  setSelection: (ids: string[]) => void;
  selectWire: (id: string | null) => void;
  addWire: (wire: Omit<Wire, 'id'>) => void;
  updateWire: (id: string, points: { x: number, y: number }[]) => void;
  redesignCircuit: () => void;
  saveCircuit: (name: string) => Promise<void>;
  loadCircuit: (name: string) => Promise<void>;
  downloadCircuit: (name?: string) => void;
  uploadCircuit: (file: File) => Promise<void>;
  setIsDragging: (v: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleTheme: () => void;
  rotateSelected: () => void;
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
  updateSimulationConfig: (config: SimulationConfig) => void;
  setSimulationResults: (data: SimulationData | null, netlistRes?: NetlistResult) => void;
  setIsSimOverlayOpen: (open: boolean) => void;
  
  // Graph Actions
  splitGraphPane: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  deleteGraphPane: (paneId: string) => void;
  clearGraphPane: (paneId: string) => void;
  updateGraphPaneVariables: (paneId: string, vars: string[]) => void;
  setGraphPaneXAxis: (paneId: string, xAxis: string | undefined) => void;
  setGraphPaneColor: (paneId: string, variable: string, color: string) => void;
  addVariableToActivePane: (variable: string) => void;
  startProbing: (paneId: string, mode: ProbeMode) => void;
  stopProbing: () => void;
  setDetailedProbeTarget: (target: ComponentProbeTarget | null) => void; 
}

export interface ActionDeps {
    components: CircuitComponent[];
    setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
    wires: Wire[];
    setWires: React.Dispatch<React.SetStateAction<Wire[]>>;
    grids: VirtualGrid[];
    setGrids: React.Dispatch<React.SetStateAction<VirtualGrid[]>>;
    reports: CircuitReport[]; 
    setReports: React.Dispatch<React.SetStateAction<CircuitReport[]>>; 
    selectedComponentIds: string[];
    setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
    selectedWireId: string | null;
    setSelectedWireId: React.Dispatch<React.SetStateAction<string | null>>;
    saveSnapshot: () => void;
    customDefinitions: ComponentDefinition[];
    setCustomDefinitions: React.Dispatch<React.SetStateAction<ComponentDefinition[]>>;
    setPendingComponent: (c: any) => void;
    setActiveTool: (t: ToolType) => void;
    stopProbing: () => void;
}
