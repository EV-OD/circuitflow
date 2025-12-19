
import { FunctionDeclaration, Type } from '@google/genai';

export const captureCircuitTool: FunctionDeclaration = {
    name: 'capture_circuit',
    description: 'Captures a visual snapshot (image) of the current circuit board. Use this when you need to see the circuit layout or verify connections visually.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
};
