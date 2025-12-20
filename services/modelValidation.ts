
import { CircuitComponent, SimulationData, NetlistResult } from '../types';
import { DesignIssue } from './auto-checker/types';

// Helper to parse value with units (e.g. "1k" -> 1000)
const parseValue = (val: string | number | undefined): number => {
    if (val === undefined) return Infinity; // No limit
    if (typeof val === 'number') return val;
    const str = val.toString().trim().toLowerCase();
    
    // Handle simple number
    if (!isNaN(Number(str))) return Number(str);

    const multipliers: Record<string, number> = {
        'p': 1e-12, 'n': 1e-9, 'u': 1e-6, 'm': 1e-3,
        'k': 1e3, 'meg': 1e6, 'g': 1e9, 't': 1e12
    };
    
    // Regex to split number and unit
    // Matches: 100, 100k, 100uF (ignores F), 100V (ignores V)
    const match = str.match(/^([\d.]+)([a-z]+)/);
    if (!match) return parseFloat(str);
    
    const num = parseFloat(match[1]);
    let unit = match[2];
    
    // Strip common suffixes that are not multipliers
    if (unit.endsWith('ohm')) unit = unit.slice(0, -3);
    else if (unit.endsWith('f') && unit !== 'f') unit = unit.slice(0, -1); // uF -> u
    else if (unit.endsWith('h') && unit !== 'h') unit = unit.slice(0, -1); // mH -> m
    else if (unit.endsWith('v')) unit = unit.slice(0, -1); // mV -> m
    else if (unit.endsWith('a')) unit = unit.slice(0, -1); // mA -> m
    else if (unit.endsWith('w')) unit = unit.slice(0, -1); // mW -> m

    return num * (multipliers[unit] || 1);
};

const getVoltageDiff = (
    node1: string, 
    node2: string, 
    data: SimulationData, 
    timeIndex: number
): number => {
    const getV = (n: string) => {
        if (n === '0') return 0;
        // Try v(n) and v(n.0) etc.
        let idx = data.variables.indexOf(`v(${n})`);
        if (idx === -1) idx = data.variables.indexOf(n); // Sometimes just node name
        if (idx === -1) return 0;
        return data.data[timeIndex][idx];
    };
    return getV(node1) - getV(node2);
};

export const validateCircuit = (
    components: CircuitComponent[],
    simulationData: SimulationData,
    netlistInfo: NetlistResult
): DesignIssue[] => {
    const issues: DesignIssue[] = [];
    
    // Iterate over all components
    components.forEach(comp => {
        const compIssues = validateComponent(comp, simulationData, netlistInfo);
        issues.push(...compIssues);
    });
    
    return issues;
};

const validateComponent = (
    comp: CircuitComponent,
    data: SimulationData,
    netlistInfo: NetlistResult
): DesignIssue[] => {
    // Get mapped nodes
    const getNode = (portId: string) => netlistInfo.nodeMap.get(`${comp.id}:${portId}`);

    // Common limits
    const p_max = parseValue(comp.properties['p_max']);
    const v_max = parseValue(comp.properties['v_max']);
    const i_max = parseValue(comp.properties['i_max']);

    // If no limits set, skip
    if (p_max === Infinity && v_max === Infinity && i_max === Infinity) return [];

    const issues: DesignIssue[] = [];
    const numPoints = data.data.length;

    // Helper to add issue
    const addIssue = (type: 'Power' | 'Voltage' | 'Current', val: number, limit: number) => {
        issues.push({
            id: `${comp.id}-${type}-limit`,
            rule: `${type} Limit Exceeded`,
            severity: 'error',
            message: `${comp.designator} exceeded max ${type.toLowerCase()}. Value: ${val.toPrecision(3)}, Limit: ${limit}`,
            componentId: comp.id,
            location: { x: comp.x, y: comp.y }
        });
    };

    // --- Resistor Validation ---
    if (comp.definitionType === 'resistor') {
        const n1 = getNode('1');
        const n2 = getNode('2');
        const R = parseValue(comp.properties['resistance']);
        
        if (n1 && n2 && R > 0) {
            let maxV = 0;
            let maxP = 0;
            
            for (let i = 0; i < numPoints; i++) {
                const v = Math.abs(getVoltageDiff(n1, n2, data, i));
                const p = (v * v) / R;
                if (v > maxV) maxV = v;
                if (p > maxP) maxP = p;
            }

            if (v_max !== Infinity && maxV > v_max) addIssue('Voltage', maxV, v_max);
            if (p_max !== Infinity && maxP > p_max) addIssue('Power', maxP, p_max);
        }
    }

    // --- Capacitor Validation ---
    else if (comp.definitionType === 'capacitor') {
        const n1 = getNode('1');
        const n2 = getNode('2');
        
        if (n1 && n2) {
            let maxV = 0;
            for (let i = 0; i < numPoints; i++) {
                const v = Math.abs(getVoltageDiff(n1, n2, data, i));
                if (v > maxV) maxV = v;
            }
            if (v_max !== Infinity && maxV > v_max) addIssue('Voltage', maxV, v_max);
        }
    }

    // --- Diode Validation ---
    else if (comp.definitionType === 'diode') {
        const nA = getNode('a');
        const nK = getNode('k');
        
        if (nA && nK) {
            let maxV_rev = 0;
            // Current is hard to get without probing, but we can check reverse voltage
            for (let i = 0; i < numPoints; i++) {
                const v = getVoltageDiff(nA, nK, data, i);
                if (v < 0 && Math.abs(v) > maxV_rev) maxV_rev = Math.abs(v);
            }
            // v_max for diode usually means Breakdown Voltage (Reverse)
            if (v_max !== Infinity && maxV_rev > v_max) addIssue('Voltage', maxV_rev, v_max);
        }
    }

    // --- Transistor (BJT) Validation ---
    else if (comp.definitionType === 'transistor_npn' || comp.definitionType === 'transistor_pnp') {
        const nC = getNode('c');
        const nE = getNode('e');
        
        if (nC && nE) {
            let maxVce = 0;
            for (let i = 0; i < numPoints; i++) {
                const v = Math.abs(getVoltageDiff(nC, nE, data, i));
                if (v > maxVce) maxVce = v;
            }
            if (v_max !== Infinity && maxVce > v_max) addIssue('Voltage', maxVce, v_max);
        }
    }

    // --- Transistor (MOSFET) Validation ---
    else if (comp.definitionType === 'transistor_nmos' || comp.definitionType === 'transistor_pmos' || comp.definitionType === 'nmos' || comp.definitionType === 'pmos') {
        const nD = getNode('d');
        const nS = getNode('s');
        
        if (nD && nS) {
            let maxVds = 0;
            for (let i = 0; i < numPoints; i++) {
                const v = Math.abs(getVoltageDiff(nD, nS, data, i));
                if (v > maxVds) maxVds = v;
            }
            if (v_max !== Infinity && maxVds > v_max) addIssue('Voltage', maxVds, v_max);
        }
    }

    return issues;
};
