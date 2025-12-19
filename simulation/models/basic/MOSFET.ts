
import { ComponentSimulationModel } from '../types';
import { getSeries, calculateDiff } from '../utils';

export const MOSFETModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        // Restrict to standard Level 1 supported outputs to prevent "zero length vector" errors in WASM
        return [
            `@${name}[id]`, 
            `@${name}[is]`, 
            `@${name}[ig]`, 
            `@${name}[ib]`,
            `@${name}[vgs]`, 
            `@${name}[vds]`, 
            `@${name}[vbs]`,
            `@${name}[gm]`, 
            `@${name}[gds]`
        ];
    },
    getData: (info, data) => {
        const name = info.spiceName;
        // Get node names
        const nd = info.nodes.get('d') || '0';
        const ng = info.nodes.get('g') || '0';
        const ns = info.nodes.get('s') || '0';
        const nb = info.nodes.get('b') || '0';

        // Helper: Try direct probe, fallback to manual calc
        const getOrCalc = (probe: string, n1: string, n2: string) => {
            const val = getSeries(data, `@${name}[${probe}]`);
            if (val && val.length > 0) return val;
            return calculateDiff(data, n1, n2);
        };

        return {
            'I_d (A)': getSeries(data, `@${name}[id]`) || [],
            'I_s (A)': getSeries(data, `@${name}[is]`) || [],
            'I_g (A)': getSeries(data, `@${name}[ig]`) || [],
            'I_b (A)': getSeries(data, `@${name}[ib]`) || [],
            
            // Standard Voltages
            'V_gs (V)': getOrCalc('vgs', ng, ns),
            'V_ds (V)': getOrCalc('vds', nd, ns),
            'V_bs (V)': getOrCalc('vbs', nb, ns),
            
            // Derived Voltages (Calculated manually)
            'V_gd (V)': calculateDiff(data, ng, nd),
            'V_sd (V)': calculateDiff(data, ns, nd),
            'V_sg (V)': calculateDiff(data, ns, ng),
            
            // Parameters
            'gm (S)': getSeries(data, `@${name}[gm]`) || [],
            'gds (S)': getSeries(data, `@${name}[gds]`) || []
        };
    }
};
