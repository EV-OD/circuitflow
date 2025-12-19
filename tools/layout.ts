
import { FunctionDeclaration, Type } from '@google/genai';

export const createLayoutGridTool: FunctionDeclaration = {
    name: 'create_layout_grid',
    description: 'Creates a virtual grid guide to assist with component placement. Returns a grid_id. Spacing will be snapped to multiples of 20.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: 'Origin X (snapped to canvas grid)' },
        y: { type: Type.NUMBER, description: 'Origin Y (snapped to canvas grid)' },
        rows: { type: Type.NUMBER, description: 'Number of rows' },
        cols: { type: Type.NUMBER, description: 'Number of columns' },
        spacing: { type: Type.NUMBER, description: 'Grid spacing (default 120, snapped to 20)' }
      },
      required: ['rows', 'cols', 'x', 'y']
    }
};
