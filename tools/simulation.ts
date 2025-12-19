
import { FunctionDeclaration, Type } from '@google/genai';

export const analyzeCircuitTool: FunctionDeclaration = {
    name: 'analyze_circuit',
    description: 'Runs a simulation (TRAN, DC, OP, AC, SWEEP).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        analysisType: { type: Type.STRING, description: '"TRAN", "DC", "OP", "AC"' },
        // TRAN params
        stopTime: { type: Type.STRING },
        // DC params
        source: { type: Type.STRING },
        start: { type: Type.STRING },
        stop: { type: Type.STRING },
        step: { type: Type.STRING },
        // AC params
        acStart: { type: Type.STRING, description: "Start Freq (e.g. 10Hz)" },
        acStop: { type: Type.STRING, description: "Stop Freq (e.g. 1MHz)" },
        acPoints: { type: Type.NUMBER, description: "Points per decade (e.g. 10)" },
        // Parametric Sweep
        sweepParam: { 
            type: Type.OBJECT,
            description: "Sweep a component property (Parametric Sweep)",
            properties: {
                componentId: { type: Type.STRING },
                property: { type: Type.STRING, description: "e.g. resistance" },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                step: { type: Type.NUMBER }
            }
        },
        // AC Source Configuration
        acSource: {
            type: Type.OBJECT,
            description: "Define which source drives the AC signal (mag=1, phase=0)",
            properties: {
                componentId: { type: Type.STRING }
            }
        },
        // Generic Modifications (Monte Carlo etc)
        modifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    componentId: { type: Type.STRING },
                    property: { type: Type.STRING },
                    value: { type: Type.STRING, description: "New value or SPICE expression" }
                }
            }
        },
        extraDirectives: { type: Type.STRING, description: "Raw SPICE directives like .step, .param, etc." }
      },
      required: ['analysisType']
    }
};
