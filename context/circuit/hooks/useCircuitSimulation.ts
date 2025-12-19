
import { useState, useCallback, useEffect, useRef } from 'react';
import { SimulationConfig, SimulationData, NetlistResult, GraphLayout, GraphPane, ProbeMode, ComponentProbeTarget } from '../../../types';
import { useGraphSystem } from '../../useGraphSystem';
import { ensureVariable } from '../../../services/VariableManager';
import { normalizeVar } from '../../../services/VariableManager/Normalizers';

const DEFAULT_PANE_ID = 'main-pane';
const DEFAULT_LAYOUT: GraphLayout = {
    id: 'root',
    type: 'pane',
    paneId: DEFAULT_PANE_ID
};

export const useCircuitSimulation = () => {
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig | null>(null);
  const [simulationResults, setSimulationResultsState] = useState<SimulationData | null>(null);
  const [lastNetlistResult, setLastNetlistResult] = useState<NetlistResult | null>(null);
  const [isSimOverlayOpen, setIsSimOverlayOpen] = useState(false);
  const [probingPaneId, setProbingPaneId] = useState<string | null>(null);
  const [probeMode, setProbeMode] = useState<ProbeMode>(null);
  const [detailedProbeTarget, setDetailedProbeTarget] = useState<ComponentProbeTarget | null>(null);

  // Initialize Config
  useEffect(() => {
    const savedConfig = localStorage.getItem('circuitflow_sim_config');
    if (savedConfig) {
        try {
            setSimulationConfig(JSON.parse(savedConfig));
        } catch (e) { console.error(e); }
    }
  }, []);

  // Graph System
  const graphSystem = useGraphSystem(DEFAULT_LAYOUT, DEFAULT_PANE_ID);
  const { setGraphPanes, addVariableToActivePane: addToGraphSystem, graphPanes } = graphSystem;

  // Sync graphPanes to a ref to avoid stale closures in async callbacks
  const graphPanesRef = useRef(graphPanes);
  useEffect(() => {
      graphPanesRef.current = graphPanes;
  }, [graphPanes]);

  const updateSimulationConfig = useCallback((config: SimulationConfig) => {
      setSimulationConfig(config);
      localStorage.setItem('circuitflow_sim_config', JSON.stringify(config));
  }, []);

  const setSimulationResults = useCallback((data: SimulationData | null, netlistRes?: NetlistResult) => {
      const currentPanes = graphPanesRef.current;
      
      let enhancedData = data;
      
      if (enhancedData && currentPanes) {
          // 1. Synthesize existing variables if possible
          const usedVariables = new Set<string>();
          Object.values(currentPanes).forEach((pane) => {
              if (pane && Array.isArray((pane as GraphPane).variables)) {
                  (pane as GraphPane).variables.forEach(v => usedVariables.add(v));
              }
          });

          if (usedVariables.size > 0) {
              try {
                  usedVariables.forEach(v => {
                      if (enhancedData) {
                          enhancedData = ensureVariable(enhancedData, v);
                      }
                  });
              } catch (e) {
                  console.error("[useCircuitSimulation] Error re-synthesizing variables:", e);
              }
          }

          // 2. CLEANUP: Remove variables from panes if they don't exist in the new data
          // This prevents "zombie" traces from deleted components
          const availableVars = new Set(enhancedData.variables.map(normalizeVar));
          
          setGraphPanes((prev: any) => {
              const next = { ...prev };
              let hasChanges = false;

              Object.keys(next).forEach(paneId => {
                  const pane = next[paneId] as GraphPane;
                  if (!pane || !pane.variables) return;

                  const validVars = pane.variables.filter(v => availableVars.has(normalizeVar(v)));
                  
                  if (validVars.length !== pane.variables.length) {
                      next[paneId] = { ...pane, variables: validVars };
                      hasChanges = true;
                  }
              });

              return hasChanges ? next : prev;
          });
      }

      setSimulationResultsState(enhancedData);
      
      if (netlistRes) setLastNetlistResult(netlistRes);
      
      // Auto-populate default pane if empty
      if (enhancedData && enhancedData.variables.length > 0) {
          setGraphPanes((prev: any) => {
              const main = prev[DEFAULT_PANE_ID];
              if (main && main.variables.length === 0) {
                  return {
                      ...prev,
                      [DEFAULT_PANE_ID]: { ...main, variables: enhancedData!.variables }
                  };
              }
              return prev;
          });
      }
  }, [setGraphPanes]); 

  const startProbing = useCallback((paneId: string, mode: ProbeMode) => {
      setProbingPaneId(paneId);
      setProbeMode(mode);
      setIsSimOverlayOpen(false); // Hide overlay to allow probing
  }, []);

  const stopProbing = useCallback(() => {
      setProbingPaneId(prev => {
          if (prev) {
              setTimeout(() => {
                  setIsSimOverlayOpen(true);
              }, 50);
          }
          return null;
      });
      setProbeMode(null);
      setDetailedProbeTarget(null);
  }, []);

  const addVariableToActivePane = useCallback((variable: string) => {
      if (!simulationResults) {
          console.warn("[useCircuitSimulation] Cannot add variable: No simulation results.");
          addToGraphSystem(variable);
          return;
      }

      try {
          const updatedData = ensureVariable(simulationResults, variable);
          if (updatedData !== simulationResults) {
              setSimulationResultsState(updatedData);
          }
          addToGraphSystem(variable);
      } catch (e) {
          console.error("[useCircuitSimulation] Failed to add variable:", e);
      }

  }, [simulationResults, addToGraphSystem]);

  return {
      simulationConfig, updateSimulationConfig,
      simulationResults, setSimulationResults,
      lastNetlistResult,
      isSimOverlayOpen, setIsSimOverlayOpen,
      probingPaneId, probeMode,
      detailedProbeTarget, setDetailedProbeTarget,
      startProbing, stopProbing,
      addVariableToActivePane,
      ...graphSystem
  };
};
