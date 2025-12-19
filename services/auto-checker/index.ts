
import { CircuitComponent, Wire, ComponentDefinition } from '../../types';
import { DesignIssue } from './types';
import { checkGround } from './checks/ground';
import { checkFloatingNodes } from './checks/connectivity';
import { checkVoltageSources } from './checks/voltage';

const CHECKS = [
    checkGround,
    checkFloatingNodes,
    checkVoltageSources
];

export const runAutoCheck = (
    components: CircuitComponent[],
    wires: Wire[],
    definitions: ComponentDefinition[]
): DesignIssue[] => {
    let allIssues: DesignIssue[] = [];
    
    for (const check of CHECKS) {
        allIssues = [...allIssues, ...check(components, wires, definitions)];
    }
    
    return allIssues;
};
