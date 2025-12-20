
import { ComponentCategory, ComponentDefinition } from './types';

export const GRID_SIZE = 20;
export const CANVAS_SIZE = 10000;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5;

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  // --- Primary Components ---
  {
    type: 'resistor',
    label: 'Resistor',
    category: ComponentCategory.PRIMARY,
    symbol: 'resistor',
    defaultProperties: { resistance: '1k', tolerance: '5%', p_max: '0.25', v_max: '200' },
    ports: [{ id: '1', x: -40, y: 0 }, { id: '2', x: 40, y: 0 }],
    datasheet: { p_max: 0.25, v_max: 200 } // 1/4 Watt default
  },
  {
    type: 'capacitor',
    label: 'Capacitor',
    category: ComponentCategory.PRIMARY,
    symbol: 'capacitor',
    defaultProperties: { capacitance: '10uF', voltage: '16V', v_max: '16' },
    ports: [{ id: '1', x: -20, y: 0 }, { id: '2', x: 20, y: 0 }],
    datasheet: { v_max: 16 }
  },
  {
    type: 'inductor',
    label: 'Inductor',
    category: ComponentCategory.PRIMARY,
    symbol: 'inductor',
    defaultProperties: { inductance: '100mH', i_max: '0.5' },
    ports: [{ id: '1', x: -40, y: 0 }, { id: '2', x: 40, y: 0 }],
    datasheet: { i_max: 0.5 }
  },
  {
    type: 'diode',
    label: 'Diode',
    category: ComponentCategory.PRIMARY,
    symbol: 'diode',
    defaultProperties: { model: 'D1N4148', i_max: '0.2', v_max: '75' },
    // Adjusted to +/- 20 to align with 20px grid
    ports: [{ id: 'a', x: -20, y: 0 }, { id: 'k', x: 20, y: 0 }],
    datasheet: { i_max: 0.2, v_max: 75 } // 1N4148 specs
  },
  {
    type: 'voltage_dc',
    label: 'DC Voltage',
    category: ComponentCategory.PRIMARY,
    symbol: 'source_dc',
    defaultProperties: { voltage: '5V' },
    ports: [{ id: 'plus', x: 0, y: -40 }, { id: 'minus', x: 0, y: 40 }]
  },
  {
    type: 'source_pulse',
    label: 'Pulse Source',
    category: ComponentCategory.PRIMARY,
    symbol: 'source_pulse',
    defaultProperties: { 
        v1: '0', 
        v2: '5', 
        td: '0', 
        tr: '1n', 
        tf: '1n', 
        pw: '1m', 
        per: '2m' 
    },
    ports: [{ id: 'plus', x: 0, y: -40 }, { id: 'minus', x: 0, y: 40 }]
  },
  {
    type: 'current_dc',
    label: 'DC Current',
    category: ComponentCategory.PRIMARY,
    symbol: 'source_current',
    defaultProperties: { current: '1A' },
    ports: [{ id: 'in', x: 0, y: -40 }, { id: 'out', x: 0, y: 40 }]
  },
  {
    type: 'gnd',
    label: 'Ground',
    category: ComponentCategory.PRIMARY,
    symbol: 'gnd',
    defaultProperties: {},
    ports: [{ id: '1', x: 0, y: -20 }]
  },
  {
    type: 'nmos',
    label: 'NMOS FET',
    category: ComponentCategory.PRIMARY,
    symbol: 'transistor_nmos',
    defaultProperties: { model: 'NMOS', w: '10u', l: '1u', v_max: '20', i_max: '0.2' },
    ports: [{ id: 'd', x: 20, y: -20 }, { id: 'g', x: -20, y: 0 }, { id: 's', x: 20, y: 20 }],
    datasheet: { v_max: 20, i_max: 0.2 } // Generic low power MOS
  },
  {
    type: 'pmos',
    label: 'PMOS FET',
    category: ComponentCategory.PRIMARY,
    symbol: 'transistor_pmos',
    defaultProperties: { model: 'PMOS', w: '10u', l: '1u', v_max: '20', i_max: '0.2' },
    ports: [{ id: 'd', x: 20, y: -20 }, { id: 'g', x: -20, y: 0 }, { id: 's', x: 20, y: 20 }],
    datasheet: { v_max: 20, i_max: 0.2 }
  },
  // --- Real World Components ---
  {
    type: '2n2222',
    label: '2N2222 NPN',
    category: ComponentCategory.REAL_WORLD,
    symbol: 'transistor_npn',
    defaultProperties: { model: '2N2222', mfg: 'Generic', i_max: '0.8', v_max: '40', p_max: '0.625' },
    ports: [{ id: 'c', x: 20, y: -20 }, { id: 'b', x: -20, y: 0 }, { id: 'e', x: 20, y: 20 }],
    datasheet: { i_max: 0.8, v_max: 40, p_max: 0.625 }
  },
  {
    type: '2n3906',
    label: '2N3906 PNP',
    category: ComponentCategory.REAL_WORLD,
    symbol: 'transistor_pnp',
    defaultProperties: { model: '2N3906', mfg: 'Generic', i_max: '0.2', v_max: '40', p_max: '0.625' },
    ports: [{ id: 'c', x: 20, y: -20 }, { id: 'b', x: -20, y: 0 }, { id: 'e', x: 20, y: 20 }],
    datasheet: { i_max: 0.2, v_max: 40, p_max: 0.625 }
  },
  {
    type: 'lm741',
    label: 'LM741 OpAmp',
    category: ComponentCategory.REAL_WORLD,
    symbol: 'generic',
    defaultProperties: { model: 'LM741', v_max: '22', p_max: '0.5' },
    ports: [
      { id: 'inv', x: -40, y: -20 }, // Snapped from -10
      { id: 'non', x: -40, y: 20 },  // Snapped from 10
      { id: 'out', x: 40, y: 0 },
      { id: 'v+', x: 0, y: -40 },    // Snapped from -30
      { id: 'v-', x: 0, y: 40 }      // Snapped from 30
    ],
    datasheet: { v_max: 22, p_max: 0.5 }
  }
];
