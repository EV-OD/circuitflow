
import { SimulationConfig, SimulationData, NetlistResult, CircuitComponent, Wire, ComponentDefinition } from '../types';

export interface CircuitStateSnapshot {
    components: CircuitComponent[];
    wires: Wire[];
    definitions: ComponentDefinition[];
}

export interface SimulationRunResult {
    data: SimulationData;
    netlistInfo: NetlistResult;
    timestamp: number;
}

export interface GraphImageOptions {
    width: number;
    height: number;
    title?: string;
    lineColor?: string;
    bgColor?: string;
}
