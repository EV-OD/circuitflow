
import React, { useState, useCallback } from 'react';
import { CircuitComponent, Wire } from '../types';

interface HistoryState {
  components: CircuitComponent[];
  wires: Wire[];
}

interface UseHistoryProps {
  components: CircuitComponent[];
  setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
  wires: Wire[];
  setWires: React.Dispatch<React.SetStateAction<Wire[]>>;
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const MAX_HISTORY = 50;

export const useHistory = ({
  components,
  setComponents,
  wires,
  setWires,
  setSelectedComponentIds
}: UseHistoryProps) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const saveSnapshot = useCallback(() => {
    setHistory(prev => {
        const newHistory = [...prev, { components, wires }];
        if (newHistory.length > MAX_HISTORY) {
            return newHistory.slice(newHistory.length - MAX_HISTORY);
        }
        return newHistory;
    });
    setFuture([]);
  }, [components, wires]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setFuture(prev => [{ components, wires }, ...prev]);
    
    setComponents(previous.components);
    setWires(previous.wires);
    setHistory(newHistory);
    setSelectedComponentIds([]);
  }, [history, components, wires, setComponents, setWires, setSelectedComponentIds]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setHistory(prev => [...prev, { components, wires }]);
    setComponents(next.components);
    setWires(next.wires);
    setFuture(newFuture);
    setSelectedComponentIds([]);
  }, [future, components, wires, setComponents, setWires, setSelectedComponentIds]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setFuture([]);
  }, []);

  return {
    undo,
    redo,
    saveSnapshot,
    clearHistory,
    canUndo: history.length > 0,
    canRedo: future.length > 0
  };
};
