
import { FunctionDeclaration, Type } from '@google/genai';

export const addComponentTool: FunctionDeclaration = {
    name: 'add_component',
    description: 'Adds a new electronic component to the circuit using a layout grid. You MUST create a grid first.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { 
            type: Type.STRING, 
            description: 'Component type. Valid: "resistor", "capacitor", "inductor", "voltage_dc", "source_pulse" (Use this for pulse/square wave), "current_dc", "diode", "gnd", "transistor_npn", "transistor_pnp", "nmos", "pmos", "lm741", "2n2222", "2n3906".' 
        },
        grid_id: { type: Type.STRING, description: 'ID of the layout grid to attach to.' },
        row: { type: Type.NUMBER, description: 'Grid Row Index (0-based)' },
        col: { type: Type.NUMBER, description: 'Grid Column Index (0-based)' },
        edge: { type: Type.STRING, description: 'Alignment in the cell. Options: "top", "bottom", "left", "right". (Use "top"/"bottom" for series horizontal flow, "left"/"right" for vertical branches).' },
        properties: { 
            type: Type.OBJECT, 
            description: 'Optional properties (e.g. resistance: "10k", voltage: "5V")',
            nullable: true 
        }
      },
      required: ['type', 'grid_id', 'row', 'col', 'edge']
    }
};

export const deleteComponentTool: FunctionDeclaration = {
    name: 'delete_component',
    description: 'Removes a component from the circuit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        designator: { type: Type.STRING, description: 'The Short Designator (e.g. R1) of the component to delete' }
      },
      required: ['designator']
    }
};

export const connectComponentsTool: FunctionDeclaration = {
    name: 'connect_components',
    description: 'Connects two components with a wire using their Designators and Port IDs.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: { type: Type.STRING, description: 'Designator of the source component (e.g. V1)' },
        sourcePort: { type: Type.STRING, description: 'Port ID of the source (e.g. "plus", "1", "c")' },
        target: { type: Type.STRING, description: 'Designator of the target component (e.g. R1)' },
        targetPort: { type: Type.STRING, description: 'Port ID of the target (e.g. "1", "2", "b")' }
      },
      required: ['source', 'sourcePort', 'target', 'targetPort']
    }
};

export const getCircuitStateTool: FunctionDeclaration = {
    name: 'get_circuit_state',
    description: 'Returns the current components (with Designators, positions, and valid ports) and connections.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
};
