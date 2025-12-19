
import { FunctionDeclaration, Type } from '@google/genai';

export const getComponentDataTool: FunctionDeclaration = {
    name: 'get_component_data',
    description: 'Retrieves current simulation status, electrical metrics (voltage, current, power), and datasheet limits for this component.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
};

export const googleSearchFunction: FunctionDeclaration = {
    name: 'googleSearch',
    description: 'Perform a google search to find component datasheets, pinouts, or specifications.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: 'The search query' }
        },
        required: ['query']
    }
};

export const componentChatTools = [
    getComponentDataTool,
    googleSearchFunction
];
