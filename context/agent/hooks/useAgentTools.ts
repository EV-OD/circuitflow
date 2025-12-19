
import { useRef, useEffect } from 'react';
import { useCircuit } from '../../CircuitContext';
import { CircuitComponent } from '../../../types';
import { 
    handleAddComponent, 
    handleDeleteComponent, 
    handleConnectComponents, 
    handleGetCircuitState
} from '../handlers/circuitHandlers';
import { 
    handleRotateComponent, 
    handleMoveComponent 
} from '../handlers/manipulationHandlers';
import { handleAnalyzeCircuit } from '../handlers/simulationHandlers';
import { handleCaptureCircuit } from '../handlers/captureHandler';
import { handleCreateLayoutGrid } from '../handlers/layoutHandlers';
import { handleRunElectricalAnalysis } from '../handlers/analysisHandlers';
import { handleSubmitCircuitReport } from '../handlers/reportingHandlers';
import { handleCheckDesignRules } from '../handlers/designCheckHandlers';
import { 
    handleCreateSeriesCircuit, 
    handleCreateParallelCircuit, 
    handleCreateVoltageDivider, 
    handleBatchModifyProperties 
} from '../handlers/templateHandlers';

export const useAgentTools = () => {
  const { 
    components, 
    wires, 
    grids,
    addComponent, 
    deleteComponent, 
    updateComponent, 
    addWire, 
    addGrid,
    addReport,
    customDefinitions,
    setSimulationResults,
    simulationResults, 
    lastNetlistResult, // Access Netlist map
    setIsSimOverlayOpen,
    canvasRef
  } = useCircuit();

  // Use refs to access latest state inside async executeTools
  const componentsRef = useRef(components);
  const wiresRef = useRef(wires);
  const gridsRef = useRef(grids);
  const customDefinitionsRef = useRef(customDefinitions);
  const simulationResultsRef = useRef(simulationResults);
  const lastNetlistRef = useRef(lastNetlistResult);

  useEffect(() => {
      componentsRef.current = components;
      wiresRef.current = wires;
      gridsRef.current = grids;
      customDefinitionsRef.current = customDefinitions;
      simulationResultsRef.current = simulationResults;
      lastNetlistRef.current = lastNetlistResult;
  }, [components, wires, customDefinitions, grids, simulationResults, lastNetlistResult]);

  const executeTools = async (toolCalls: any[]): Promise<any> => {
      const responses = [];
      
      const batchComponents: CircuitComponent[] = [];

      const circuitActions = { addComponent, deleteComponent, addWire, updateComponent };
      const manipActions = { updateComponent };
      const layoutActions = { addGrid };
      const simActions = { setSimulationResults, setIsSimOverlayOpen };
      const reportActions = { addReport };

      for (const call of toolCalls) {
          const { name, args } = call;
          console.log(`%c[Agent Tool] 🔧 ${name}`, 'color: #3b82f6; font-weight: bold;', args);
          
          let result: any = { status: 'ok' };

          try {
              const refs = {
                  components: componentsRef.current,
                  wires: wiresRef.current,
                  customDefinitions: customDefinitionsRef.current,
                  grids: gridsRef.current
              };

              switch (name) {
                  case 'add_component':
                      result = handleAddComponent(args, circuitActions, refs, batchComponents);
                      break;

                  case 'createSeriesCircuit':
                      result = handleCreateSeriesCircuit(args, circuitActions, refs, batchComponents);
                      break;

                  case 'createParallelCircuit':
                      result = handleCreateParallelCircuit(args, circuitActions, refs, batchComponents);
                      break;

                  case 'createVoltageDivider':
                      result = handleCreateVoltageDivider(args, circuitActions, refs, batchComponents);
                      break;

                  case 'batchModifyProperties':
                      result = handleBatchModifyProperties(args, circuitActions, refs);
                      break;

                  case 'create_layout_grid':
                      result = handleCreateLayoutGrid(args, layoutActions);
                      break;

                  case 'delete_component':
                      result = handleDeleteComponent(args, circuitActions, refs);
                      break;
                  
                  case 'rotate_component':
                      result = handleRotateComponent(args, manipActions, refs);
                      break;

                  case 'move_component':
                      result = handleMoveComponent(args, manipActions, refs);
                      break;

                  case 'connect_components':
                      result = handleConnectComponents(args, circuitActions, refs, batchComponents);
                      break;

                  case 'get_circuit_state':
                      result = handleGetCircuitState(refs, batchComponents);
                      break;

                  case 'capture_circuit':
                      result = await handleCaptureCircuit(canvasRef);
                      break;

                  case 'analyze_circuit':
                      result = await handleAnalyzeCircuit(args, simActions, refs, batchComponents);
                      break;

                  case 'run_electrical_analysis':
                      result = await handleRunElectricalAnalysis(args, refs, reportActions);
                      break;
                  
                  case 'check_design_rules':
                      result = handleCheckDesignRules(args, {
                          components: refs.components,
                          wires: refs.wires,
                          simulationResults: simulationResultsRef.current,
                          lastNetlist: lastNetlistRef.current
                      });
                      break;

                  case 'submit_circuit_report':
                      // Now awaited to allow for AI enhancement layer
                      result = await handleSubmitCircuitReport(args, reportActions, simulationResultsRef.current);
                      break;
                      
                  case 'googleSearch':
                      result = { message: "Search functionality simulated. Assume generic component specs." };
                      break;

                  default:
                      result = { error: `Unknown tool: ${name}` };
              }
          } catch (e: any) {
              console.error("Tool Execution Error", e);
              result = { error: e.message };
          }

          console.log(`%c[Tool Result] ✅ ${name}`, 'color: #10b981;', result);

          responses.push({
              functionResponse: {
                  name: name,
                  response: { result }
              }
          });
      }
      return responses;
  };

  return { executeTools };
};
