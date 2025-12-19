
import { SimulationData } from '../../types';

// Helper to normalize strings for comparison (remove whitespace, lowercase)
const norm = (s: string) => s.toLowerCase().replace(/\s/g, '');

/**
 * Ensures that the requested 'variable' exists in the 'data' object.
 * If missing, it attempts to synthesize it (e.g. v(a,b) = v(a) - v(b)).
 * Returns a new SimulationData object if changes were made, otherwise the original.
 */
export const ensureVariable = (data: SimulationData, variable: string): SimulationData => {
    if (!data || !data.variables || !data.data) return data;

    const target = norm(variable);
    
    // 1. Check if variable already exists
    const exists = data.variables.some(v => norm(v) === target);
    if (exists) return data;

    console.log(`[Synthesizer] Variable '${variable}' not found. Attempting synthesis...`);

    // 2. Check for Differential Syntax: v(a,b) or V(a, b)
    // Regex captures 'a' and 'b' from 'v(a,b)'
    const diffMatch = target.match(/^v\((.+),(.+)\)$/);
    
    if (diffMatch) {
        const nodeA = diffMatch[1]; // e.g. "4"
        const nodeB = diffMatch[2]; // e.g. "1"
        
        console.log(`[Synthesizer] Detected differential request: ${nodeA} - ${nodeB}`);

        const colA = findColumn(data, nodeA);
        const colB = findColumn(data, nodeB);

        if (colA && colB) {
            console.log(`[Synthesizer] Found dependencies. Calculating v(${nodeA}) - v(${nodeB}).`);
            
            // Perform subtraction: A - B
            const newData = data.data.map((row, i) => [...row, colA[i] - colB[i]]);
            
            return {
                ...data,
                variables: [...data.variables, variable],
                data: newData
            };
        } else {
            console.warn(`[Synthesizer] Could not find dependencies for ${variable}. Found A? ${!!colA}, Found B? ${!!colB}`);
        }
    }

    // 3. Fallback: Add Zero Column to prevent UI crashes/infinite loading
    // This allows the graph to render a flat line instead of breaking
    console.warn(`[Synthesizer] Failed to synthesize '${variable}'. Returning 0-filled placeholder.`);
    const zeroCol = new Array(data.data.length).fill(0);
    return {
        ...data,
        variables: [...data.variables, variable],
        data: data.data.map(row => [...row, 0])
    };
};

/**
 * Finds the data column for a given node name.
 * Handles "0" (ground) and searches for "v(name)" or just "name".
 */
const findColumn = (data: SimulationData, nodeName: string): number[] | null => {
    const nName = norm(nodeName);
    
    // 1. Handle Ground (0) -> Return array of zeros
    if (nName === '0' || nName === 'gnd') {
        return new Array(data.data.length).fill(0);
    }

    // 2. Search variables for "v(name)" or exact "name"
    const idx = data.variables.findIndex(v => {
        const nv = norm(v);
        return nv === nName || nv === `v(${nName})`;
    });

    if (idx !== -1) {
        return data.data.map(row => row[idx]);
    }

    return null;
};
