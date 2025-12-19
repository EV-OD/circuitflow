
import { SimulationData } from '../../types';
import { normalizeVar } from '../../services/VariableManager/Normalizers';

export const getSeries = (data: SimulationData, variable: string): number[] | null => {
    // Normalization handles case-insensitivity and whitespace
    const idx = data.variables.findIndex(v => normalizeVar(v) === normalizeVar(variable));
    if (idx === -1) return null;
    return data.data.map(row => row[idx]);
};

export const calculateDiff = (data: SimulationData, nodeA: string, nodeB: string): number[] => {
    const vA = getSeries(data, `v(${nodeA})`) || getSeries(data, nodeA) || new Array(data.data.length).fill(0);
    const vB = getSeries(data, `v(${nodeB})`) || getSeries(data, nodeB) || new Array(data.data.length).fill(0);
    
    return vA.map((val, i) => val - vB[i]);
};

// Safe division for derived parameters (e.g. Beta = Ic / Ib)
export const safeDiv = (numerator: number[], denominator: number[]): number[] => {
    return numerator.map((num, i) => {
        const den = denominator[i];
        return Math.abs(den) > 1e-12 ? num / den : 0;
    });
};
