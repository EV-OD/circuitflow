
import { FunctionDeclaration, Type } from '@google/genai';

export const submitCircuitReportTool: FunctionDeclaration = {
    name: 'submit_circuit_report',
    description: 'Saves a structured technical report to the project history. Call this AFTER analyzing the circuit using validate_circuit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title e.g. 'Power Stage Validation'" },
        summary: { type: Type.STRING, description: "One sentence summary." },
        tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Tags like ['PASS', 'FAIL', 'High Voltage']"
        },
        sections: {
            type: Type.OBJECT,
            properties: {
                overall: { type: Type.STRING, description: "Markdown text: General assessment." },
                problems: { type: Type.STRING, description: "Markdown text list of specific issues found." },
                recommendations: { type: Type.STRING, description: "Markdown text list of specific fixes (e.g. 'Add 100uF cap at V1')." },
                warnings: { type: Type.STRING, description: "Markdown text" },
                cautions: { type: Type.STRING, description: "Markdown text" }
            },
            required: ['overall']
        }
      },
      required: ['title', 'summary', 'sections']
    }
};
