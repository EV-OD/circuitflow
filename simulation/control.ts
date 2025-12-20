
import { SimulationConfig } from '../types';
import { generateSpiceNetlist } from '../services/netlistGenerator';
import { simulationService } from '../services/simulationService';
import { CircuitStateSnapshot, SimulationRunResult } from './types';

/**
 * Helper to construct SPICE directive string from configuration.
 */
export const getSimulationDirective = (config: SimulationConfig | null): string => {
    if (!config) return '';
    
    if (config.type === 'TRAN') {
        const step = config.transient.stepTime || '10us';
        const stop = config.transient.stopTime || '10ms';
        const start = config.transient.startTime || '0';
        return `.TRAN ${step} ${stop} ${start}`;
    } else if (config.type === 'DC') {
        const src = config.dc.source || 'V1';
        const start = config.dc.start || '0';
        const stop = config.dc.stop || '5';
        const incr = config.dc.increment || '0.1';
        return `.DC ${src} ${start} ${stop} ${incr}`;
    } else if (config.type === 'OP') {
        return '.OP';
    }
    return '';
};

/**
 * Starts a simulation with the provided configuration and circuit state.
 * Returns a comprehensive result object containing data and node mappings.
 */
export const startSimulation = async (
    config: SimulationConfig,
    circuit: CircuitStateSnapshot
): Promise<SimulationRunResult> => {
    // 1. Construct SPICE Directives based on Config
    const directive = getSimulationDirective(config);
    
    if (!directive) {
        throw new Error(`Invalid or unsupported simulation type: ${config?.type}`);
    }

    // 2. Generate Netlist
    // enableInstrumentation=true allows us to get internal currents for detailed analysis later
    const netlistResult = generateSpiceNetlist(
        circuit.components,
        circuit.wires,
        'LabSimulation',
        directive,
        circuit.definitions,
        new Map(), // No overrides for now
        true 
    );

    // 3. Execute Simulation
    const data = await simulationService.runSimulation(netlistResult.netlist);

    if (!data || (data.data.length === 0 && data.variables.length === 0)) {
        const errorMsg = data?.logs 
            ? `Simulation failed. Logs:\n${data.logs.slice(-500)}` // Show last 500 chars
            : "Simulation produced no data.";
        throw new Error(errorMsg);
    }

    return {
        data,
        netlistInfo: netlistResult,
        timestamp: Date.now()
    };
};
