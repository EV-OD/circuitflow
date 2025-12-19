
import { FunctionDeclaration, Type } from '@google/genai';

export const checkDesignRulesTool: FunctionDeclaration = {
    name: 'check_design_rules',
    description: 'Executes a suite of 24 engineering design checks including: Ground integrity, Floating nodes, Biasing stability (BJT/MOSFET), Decoupling capacitors, Component orientation, and Rail voltage levels. Requires simulation to have been run previously.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        focusAreas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Optional list of specific areas to focus on (e.g. ['power', 'signal'])."
        }
      }
    }
};
