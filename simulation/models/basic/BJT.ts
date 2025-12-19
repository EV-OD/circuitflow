
import { ComponentSimulationModel } from '../types';
import { getSeries, safeDiv } from '../utils';

export const BJTModel: ComponentSimulationModel = {
    getProbes: (info) => {
        const name = info.spiceName;
        return [
            `@${name}[ic]`, `@${name}[ib]`, `@${name}[ie]`, `@${name}[is]`,
            `@${name}[vbe]`, `@${name}[vbc]`, `@${name}[vce]`
        ];
    },
    getData: (info, data) => {
        const name = info.spiceName;

        const Ic = getSeries(data, `@${name}[ic]`) || [];
        const Ib = getSeries(data, `@${name}[ib]`) || [];
        const Ie = getSeries(data, `@${name}[ie]`) || [];
        const Is = getSeries(data, `@${name}[is]`) || [];

        const Vbe = getSeries(data, `@${name}[vbe]`) || [];
        const Vbc = getSeries(data, `@${name}[vbc]`) || [];
        const Vce = getSeries(data, `@${name}[vce]`) || [];

        return {
            'I_c (A)': Ic,
            'I_b (A)': Ib,
            'I_e (A)': Ie,
            'I_sub (A)': Is,
            'V_ce (V)': Vce,
            'V_be (V)': Vbe,
            'V_bc (V)': Vbc,
            'Beta (hFE)': safeDiv(Ic, Ib),
            'Alpha': safeDiv(Ic, Ie)
        };
    }
};
