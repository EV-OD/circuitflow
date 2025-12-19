
import { ComponentSimulationModel } from '../types';
import { calculateDiff, getSeries } from '../utils';

export const InductorModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        // flux might not be available in all models but we request it
        return [`@${name}[i]`, `@${name}[p]`, `@${name}[flux]`];
    },
    getData: (info, data) => {
        const n1 = info.nodes.get('1') || '0';
        const n2 = info.nodes.get('2') || '0';
        const name = info.spiceName;
        
        return {
            'Voltage (V)': calculateDiff(data, n1, n2),
            'Current (A)': getSeries(data, `@${name}[i]`) || [],
            'Power (W)': getSeries(data, `@${name}[p]`) || [],
            'Flux': getSeries(data, `@${name}[flux]`) || []
        };
    }
};
