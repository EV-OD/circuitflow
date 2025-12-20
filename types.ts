
export enum ToolType {
  MOVE = 'MOVE',
  WIRE = 'WIRE',
  AUTO_WIRE = 'AUTO_WIRE',
  DELETE = 'DELETE', // Mapped to 'X' key
  DUPLICATE = 'DUPLICATE',
  PAN = 'PAN',
  PROBE = 'PROBE',
}

export type ProbeMode = 'VOLTAGE' | 'CURRENT' | 'COMPONENT_DETAILS' | null;

export interface ComponentProbeTarget {
    componentId: string;
    x: number;
    y: number;
}

export enum ComponentCategory {
  PRIMARY = 'PRIMARY',
  REAL_WORLD = 'REAL_WORLD',
}

export interface VirtualGrid {
  id: string;
  x: number; 
  y: number;
  rows: number; 
  cols: number;
  spacing: number;
}

export interface Port {
  id: string;
  x: number; // Relative to component center
  y: number; // Relative to component center
}

export interface ComponentDatasheet {
  p_max?: number;      // Max Power Dissipation (Watts)
  v_max?: number;      // Max Voltage (Volts)
  i_max?: number;      // Max Continuous Current (Amps)
  i_peak?: number;     // Max Peak Current (Amps)
  temp_coeff?: number; // Temperature Coefficient
}

export interface ComponentDefinition {
  type: string;
  label: string;
  category: ComponentCategory;
  symbol: 'resistor' | 'capacitor' | 'inductor' | 'source_dc' | 'source_current' | 'source_pulse' | 'diode' | 'gnd' | 'transistor_npn' | 'transistor_pnp' | 'transistor_nmos' | 'transistor_pmos' | 'generic';
  defaultProperties: Record<string, string | number>;
  ports: Port[];
  description?: string;
  datasheet?: ComponentDatasheet; // Safety limits
}

export interface CircuitComponent {
  id: string;
  designator: string; // Unique human-readable ID (e.g. R1, Q2)
  definitionType: string; // Refers to ComponentDefinition.type
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  properties: Record<string, string | number>;
}

export interface Wire {
  id: string;
  sourceComponentId: string;
  sourcePortId: string;
  destComponentId: string;
  destPortId: string;
  points?: XY[]; // Intermediate waypoints
}

export interface CircuitState {
  components: CircuitComponent[];
  wires: Wire[];
  customDefinitions?: ComponentDefinition[];
  grids?: VirtualGrid[];
  name: string;
  lastModified: number;
  reports?: CircuitReport[]; // New: Persist reports
}

export interface ViewportTransform {
  x: number;
  y: number;
  k: number; // Zoom scale
}

export interface XY {
  x: number;
  y: number;
}

export interface SimulationData {
  title: string;
  analysisType: string;
  variables: string[]; // e.g., ["time", "v(in)", "v(out)"]
  data: number[][]; // Array of rows, where each row is an array of values
  measurements?: Record<string, number>; // Scalar results from .meas directives
  logs?: string; // Raw simulation logs for debugging
}

export interface SimulationConfig {
  type: 'TRAN' | 'DC' | 'OP';
  transient: {
    stopTime: string;
    stepTime: string;
    startTime: string;
  };
  dc: {
    source: string;
    start: string;
    stop: string;
    increment: string;
  };
}

export interface NetlistResult {
  netlist: string;
  nodeMap: Map<string, string>; // Maps "compId:portId" -> "SpiceNodeName" (e.g. "1", "in")
  componentMap: Map<string, string>; // Maps "compId" -> "SpiceComponentName" (e.g. "R1", "V1")
  currentProbes?: Map<string, string>; // Maps "compId:portId" -> "V_sense_name" for instrumented currents
}

export interface GraphPane {
  id: string;
  variables: string[]; // Variables to show in this pane
  xAxis?: string; // Optional: Variable to use as X Axis. Default is index 0 of sim results.
}

export interface GraphLayout {
  id: string;
  type: 'row' | 'col' | 'pane';
  children?: GraphLayout[]; // For row/col
  paneId?: string; // For pane
  size?: number; // Flex ratio
}

// AI Agent Types
export type AgentMode = 'builder' | 'auditor';

export interface ToolCallSummary {
  name: string;
  args: any;
  status: 'running' | 'complete' | 'error';
  result?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system' | 'function';
  content: string;
  timestamp: number;
  isError?: boolean;
  toolCalls?: ToolCallSummary[];
}

export interface AgentState {
  messages: ChatMessage[];
  isThinking: boolean;
  isOpen: boolean;
}

export interface AgentUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalRequests: number;
}

// Report Types
export interface CircuitReport {
  id: string;
  timestamp: number;
  title: string;
  summary: string;
  tags: string[]; // e.g. ["PASS", "DC Analysis", "3 Issues"]
  sections: {
    overall: string;
    problems: string;
    recommendations: string;
    warnings: string;
    cautions: string;
    [key: string]: string; // Extensible
  };
  measurements?: Record<string, number>; // Captured scalar data from sim
  simulationData?: SimulationData; // Full simulation data for graphing
}
