
import { ComponentSimulationModel } from '../types';
import { getSeries } from '../utils';

export const DiodeModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        return [`@${name}[id]`, `@${name}[vd]`, `@${name}[p]`];
    },
    getData: (info, data) => {
        const name = info.spiceName;
        
        return {
            'Voltage (V)': getSeries(data, `@${name}[vd]`) || [],
            'Current (A)': getSeries(data, `@${name}[id]`) || [],
            'Power (W)': getSeries(data, `@${name}[p]`) || []
        };
    }
};
