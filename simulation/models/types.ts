
import { SimulationData } from '../../types';

export interface SimulationComponentInfo {
    componentId: string;
    spiceName: string; // e.g. "Q1", "R1"
    nodes: Map<string, string>; // Port ID -> Spice Node Name (e.g. "c" -> "2")
}

export interface ComponentSimulationModel {
    /** 
     * Returns a list of specific SPICE variables (probes) needed for this component.
     * e.g., ["@Q1[ic]", "@Q1[ib]"] or ["I(V1)"]
     */
    getProbes: (info: SimulationComponentInfo) => string[];

    /**
     * Extracts and calculates relevant electrical quantities from the simulation results.
     * Returns a map of Label -> Data Array.
     * e.g. { "V_ce": [0.1, 0.5...], "I_c": [0.01, ...] }
     */
    getData: (info: SimulationComponentInfo, data: SimulationData) => Record<string, number[]>;
}
