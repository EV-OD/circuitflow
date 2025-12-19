
import { ComponentSimulationModel } from '../types';
import { calculateDiff, getSeries } from '../utils';

// DC, Pulse, Sine Sources (V)
export const VoltageSourceModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        // Request internal current. Note: I(V1) is standard, but @v1[i] is internal vector
        return [`I(${name})`];
    },
    getData: (info, data) => {
        const p = info.nodes.get('plus') || '0';
        const m = info.nodes.get('minus') || '0';
        const name = info.spiceName;

        return {
            'Voltage (V)': calculateDiff(data, p, m),
            'Current (A)': getSeries(data, `I(${name})`) || []
        };
    }
};

// Current Source (I)
export const CurrentSourceModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        // Current sources have voltage across them [v] and current [i] or [c]
        // Ngspice: @i1[v], @i1[c]
        return [`@${name}[v]`, `@${name}[c]`];
    },
    getData: (info, data) => {
        const name = info.spiceName;
        return {
            'Voltage (V)': getSeries(data, `@${name}[v]`) || [],
            'Current (A)': getSeries(data, `@${name}[c]`) || []
        };
    }
};
