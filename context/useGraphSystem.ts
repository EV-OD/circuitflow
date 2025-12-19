
import { useState, useCallback } from 'react';
import { GraphLayout, GraphPane, SimulationData } from '../types';

export const useGraphSystem = (defaultLayout: GraphLayout, defaultPaneId: string) => {
  const [graphLayout, setGraphLayout] = useState<GraphLayout>(defaultLayout);
  const [graphPanes, setGraphPanes] = useState<Record<string, GraphPane>>({
      [defaultPaneId]: { id: defaultPaneId, variables: [] }
  });
  const [activePaneId, setActivePaneId] = useState<string>(defaultPaneId);

  const splitGraphPane = useCallback((paneId: string, direction: 'horizontal' | 'vertical') => {
      const newPaneId = crypto.randomUUID();
      const newPane: GraphPane = { id: newPaneId, variables: [] }; 
      
      setGraphPanes(prev => ({ ...prev, [newPaneId]: newPane }));

      const splitNode = (node: GraphLayout): GraphLayout => {
          if (node.type === 'pane' && node.paneId === paneId) {
              return {
                  id: crypto.randomUUID(),
                  // User expects "Horizontal" to split top/bottom (creating rows)
                  // and "Vertical" to split left/right (creating columns)
                  type: direction === 'horizontal' ? 'row' : 'col',
                  children: [
                      { ...node, size: 1 },
                      { id: crypto.randomUUID(), type: 'pane', paneId: newPaneId, size: 1 }
                  ]
              };
          }
          if (node.children) {
              return { ...node, children: node.children.map(splitNode) };
          }
          return node;
      };

      setGraphLayout(prev => splitNode(prev));
      setActivePaneId(newPaneId); 
  }, []);

  const deleteGraphPane = useCallback((paneId: string) => {
      // 1. Remove from panes map
      setGraphPanes(prev => {
          const next = { ...prev };
          delete next[paneId];
          return next;
      });

      // 2. Remove from layout tree and collapse empty containers
      const removeNode = (node: GraphLayout): GraphLayout | null => {
          if (node.type === 'pane' && node.paneId === paneId) {
              return null;
          }
          if (node.children) {
              const newChildren = node.children
                  .map(removeNode)
                  .filter((n): n is GraphLayout => n !== null);
              
              if (newChildren.length === 0) return null;
              if (newChildren.length === 1) return newChildren[0]; // Collapse container
              
              return { ...node, children: newChildren };
          }
          return node;
      };

      setGraphLayout(prev => {
          const newLayout = removeNode(prev);
          
          // If we deleted everything, reset to a default state
          if (!newLayout) {
             const newId = crypto.randomUUID();
             setGraphPanes(p => ({ [newId]: { id: newId, variables: [] } }));
             setActivePaneId(newId);
             return { id: 'root', type: 'pane', paneId: newId };
          }
          
          // If active pane was deleted, pick another one
          return newLayout;
      });
  }, []);

  const clearGraphPane = useCallback((paneId: string) => {
      setGraphPanes(prev => ({
          ...prev,
          [paneId]: { ...prev[paneId], variables: [] }
      }));
  }, []);

  const updateGraphPaneVariables = useCallback((paneId: string, vars: string[]) => {
      setGraphPanes(prev => ({
          ...prev,
          [paneId]: { ...prev[paneId], variables: vars }
      }));
      setActivePaneId(paneId);
  }, []);

  const setGraphPaneXAxis = useCallback((paneId: string, xAxis: string | undefined) => {
      setGraphPanes(prev => ({
          ...prev,
          [paneId]: { ...prev[paneId], xAxis }
      }));
  }, []);

  const setGraphPaneColor = useCallback((paneId: string, variable: string, color: string) => {
      // Placeholder for future implementation of per-variable color customization
      // currently GraphPane doesn't store this info
  }, []);

  const addVariableToActivePane = useCallback((variable: string) => {
      setGraphPanes(prev => {
          const pane = prev[activePaneId];
          if (!pane) return prev;
          if (pane.variables.includes(variable)) return prev;
          
          return {
              ...prev,
              [activePaneId]: {
                  ...pane,
                  variables: [...pane.variables, variable]
              }
          };
      });
  }, [activePaneId]);

  return {
    graphLayout,
    graphPanes,
    activePaneId,
    setGraphLayout,
    setGraphPanes,
    splitGraphPane,
    deleteGraphPane,
    clearGraphPane,
    updateGraphPaneVariables,
    setGraphPaneXAxis,
    setGraphPaneColor,
    addVariableToActivePane
  };
};
