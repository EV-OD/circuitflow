
import { FunctionDeclaration, Type } from '@google/genai';

export const googleSearchTool: FunctionDeclaration = {
      name: 'googleSearch',
      description: 'Search for component datasheets, specs, or alternatives online.',
      parameters: {
          type: Type.OBJECT,
          properties: {}
      }
};
