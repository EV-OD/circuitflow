
import { FunctionDeclaration, Type } from '@google/genai';

export const runElectricalAnalysisTool: FunctionDeclaration = {
    name: 'run_electrical_analysis',
    description: 'Executes a SPICE simulation to measure voltages, currents, and power. Returns stress analysis (Overvoltage/Overcurrent) for all components.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        simulationConfig: {
            type: Type.OBJECT,
            description: "Optional overrides for simulation params.",
            properties: {
                stopTime: { type: Type.STRING },
                stepTime: { type: Type.STRING }
            }
        }
      }
    }
};

// Re-export as named for index
export const validateCircuitTool = runElectricalAnalysisTool;
