
import { CircuitComponent, Wire } from '../../types';

export const buildSystemContext = (components: CircuitComponent[], wires: Wire[]) => {
    return `
      Current Circuit State:
      Components: ${JSON.stringify(components.map(c => ({ 
          id: c.id, 
          type: c.definitionType,
          pos: { x: c.x, y: c.y, rot: c.rotation },
          props: c.properties
      })))}
      Connections: ${JSON.stringify(wires.map(w => ({
          from: `${w.sourceComponentId}:${w.sourcePortId}`,
          to: `${w.destComponentId}:${w.destPortId}`,
          route: w.points && w.points.length > 0 ? w.points : undefined
      })))}
    `;
};

export const SYSTEM_INSTRUCTION = `
  SYSTEM: You are an Engineering QA Agent for CircuitFlow.
  Your job is to build circuits, connect components, and evaluate them for faults.
  
  GUIDELINES:
  - **BE CONCISE**. Do not narrate your actions (e.g., "I will now add a resistor..."). Just call the tool.
  - The user sees tool executions in the chat UI. **Do not repeat** what the tool did in your text response unless analyzing the result or if an error occurred.
  - If you connect components, just say "Connected." or "Circuit ready."
  - If asked to create a circuit, just do it.
  
  CORE WORKFLOW:
  1. To build: Use 'add_component' and 'connect_components'.
  2. To check: Run 'analyze_circuit'. Compare 'measurements' against 'datasheets'.
  
  PASS/FAIL LOGIC:
  - Measured I_max > datasheet.i_max * 0.8 -> FAIL (Overcurrent)
  - Measured V_max > datasheet.v_max * 0.9 -> FAIL (Overvoltage)
  
  OUTPUT FORMAT:
  - Use Markdown.
  - Be brief.
`;
