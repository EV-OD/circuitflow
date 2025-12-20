
import { useState, useCallback } from 'react';
import { useCircuit } from '../context/CircuitContext';
import { startSimulation } from '../simulation/control';
import { SimulationConfig } from '../types';

export const useSimulationRunner = () => {
  const { 
    components, 
    wires, 
    setSimulationResults, 
    setIsSimOverlayOpen,
    customDefinitions
  } = useCircuit();
  
  const [isSimulating, setIsSimulating] = useState(false);

  const executeSimulation = useCallback(async (config: SimulationConfig, circuitName: string = 'MyCircuit') => {
      setIsSimulating(true);
      try {
          // Use the centralized control logic which handles defaults, netlist generation, and execution
          const result = await startSimulation(config, { 
              components, 
              wires, 
              definitions: customDefinitions 
          });

          setSimulationResults(result.data, result.netlistInfo);
          setIsSimOverlayOpen(true);
          
      } catch (e: any) {
          console.error("Simulation failed", e);
          let msg = e.message || "Unknown error";
          
          // Heuristic hints based on common NGSPICE errors
          if (msg.includes("produced no data") || msg.includes("singular matrix") || msg.includes("no path to ground")) {
              msg += "\n\nHint: Do you have a Ground (GND) component connected?";
          }
          
          alert(`Simulation Error: ${msg}`);
      } finally {
          setIsSimulating(false);
      }
  }, [components, wires, setSimulationResults, setIsSimOverlayOpen, customDefinitions]);

  return { isSimulating, executeSimulation };
};
