
import { CircuitComponent, Wire, ComponentDefinition, SimulationData, NetlistResult } from '../../types';
import { DesignIssue } from './types';
import { checkGround } from './checks/ground';
import { checkFloatingNodes } from './checks/connectivity';
import { checkVoltageSources } from './checks/voltage';
import { validateCircuit } from '../modelValidation';

const CHECKS = [
    checkGround,
    checkFloatingNodes,
    checkVoltageSources
];

export const runAutoCheck = (
    components: CircuitComponent[],
    wires: Wire[],
    definitions: ComponentDefinition[],
    simulationData?: SimulationData,
    netlistInfo?: NetlistResult
): DesignIssue[] => {
    let allIssues: DesignIssue[] = [];
    
    for (const check of CHECKS) {
        allIssues = [...allIssues, ...check(components, wires, definitions)];
    }

    if (simulationData && netlistInfo) {
        allIssues = [...allIssues, ...validateCircuit(components, simulationData, netlistInfo)];
    }
    
    return allIssues;
};
