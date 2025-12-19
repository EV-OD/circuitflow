import { useCallback } from 'react';
import { useCircuit } from '../context/CircuitContext';
import { ToolType } from '../types';

export const useDelete = () => {
  const { activeTool, deleteComponent, deleteWire } = useCircuit();
  const isDeleteMode = activeTool === ToolType.DELETE;

  const deleteItem = useCallback((type: 'component' | 'wire', id: string) => {
    if (!isDeleteMode) return;
    
    if (type === 'component') {
      deleteComponent(id);
    } else if (type === 'wire') {
      deleteWire(id);
    }
  }, [isDeleteMode, deleteComponent, deleteWire]);

  return {
    isDeleteMode,
    deleteItem
  };
};