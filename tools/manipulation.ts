
import { FunctionDeclaration, Type } from '@google/genai';

export const rotateComponentTool: FunctionDeclaration = {
    name: 'rotate_component',
    description: 'Rotates a component by 90 degrees clockwise.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        designator: { type: Type.STRING, description: 'The Short Designator (e.g. R1, C2) of the component.' }
      },
      required: ['designator']
    }
};

export const moveComponentTool: FunctionDeclaration = {
    name: 'move_component',
    description: 'Moves a component to a new absolute grid position.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        designator: { type: Type.STRING, description: 'The Short Designator (e.g. R1, C2) of the component.' },
        x: { type: Type.NUMBER, description: 'New X coordinate' },
        y: { type: Type.NUMBER, description: 'New Y coordinate' }
      },
      required: ['designator', 'x', 'y']
    }
};
