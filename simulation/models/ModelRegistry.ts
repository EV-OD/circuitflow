
import { ComponentSimulationModel } from './types';
import { ResistorModel } from './basic/Resistor';
import { CapacitorModel } from './basic/Capacitor';
import { InductorModel } from './basic/Inductor';
import { DiodeModel } from './basic/Diode';
import { VoltageSourceModel, CurrentSourceModel } from './basic/Sources';
import { BJTModel } from './basic/BJT';
import { MOSFETModel } from './basic/MOSFET';

const registry: Record<string, ComponentSimulationModel> = {
    'resistor': ResistorModel,
    'capacitor': CapacitorModel,
    'inductor': InductorModel,
    'diode': DiodeModel,
    'voltage_dc': VoltageSourceModel,
    'source_pulse': VoltageSourceModel,
    'current_dc': CurrentSourceModel,
    '2n2222': BJTModel,
    'transistor_npn': BJTModel,
    '2n3906': BJTModel,
    'transistor_pnp': BJTModel,
    'nmos': MOSFETModel,
    'pmos': MOSFETModel,
    'transistor_nmos': MOSFETModel,
    'transistor_pmos': MOSFETModel,
};

export const getModelForComponent = (type: string): ComponentSimulationModel | null => {
    return registry[type] || null;
};
