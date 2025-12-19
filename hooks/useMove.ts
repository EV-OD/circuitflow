
import { useState, useCallback } from 'react';
import { CircuitComponent, ToolType, XY } from '../types';

interface DragState {
  id: string; // The primary component being dragged
  startX: number; // Mouse start world X
  startY: number; // Mouse start world Y
  initialPositions: Map<string, {x: number, y: number}>;
}

export const useMove = (
  activeTool: ToolType,
  components: CircuitComponent[],
  selectedComponentIds: string[],
  selectComponent: (id: string, multi: boolean) => void,
  updateComponents: (updates: { id: string, updates: Partial<CircuitComponent> }[]) => void,
  gridSize: number,
  saveSnapshot: () => void
) => {
  const [dragState, setDragState] = useState<DragState | null>(null);

  const startMove = useCallback((id: string, startPos: XY) => {
    if (activeTool !== ToolType.MOVE) return;

    let affectedIds = selectedComponentIds;

    // If clicking an unselected component, select it (exclusive)
    if (!selectedComponentIds.includes(id)) {
      selectComponent(id, false);
      affectedIds = [id];
    }
    
    // Save state before starting the drag modification
    saveSnapshot();

    // Store initial positions of ALL selected components
    const initialPositions = new Map<string, {x: number, y: number}>();
    components.forEach(c => {
        if (affectedIds.includes(c.id)) {
            initialPositions.set(c.id, { x: c.x, y: c.y });
        }
    });

    setDragState({
      id,
      startX: startPos.x,
      startY: startPos.y,
      initialPositions
    });
  }, [activeTool, components, selectedComponentIds, selectComponent, saveSnapshot]);

  const updateMove = useCallback((currentPos: XY) => {
    if (!dragState || activeTool !== ToolType.MOVE) return;

    const dx = currentPos.x - dragState.startX;
    const dy = currentPos.y - dragState.startY;

    // Calculate position for the primary dragged component
    const primaryInitial = dragState.initialPositions.get(dragState.id);
    if (!primaryInitial) return;

    const targetX = primaryInitial.x + dx;
    const targetY = primaryInitial.y + dy;

    // Snap primary component to Grid
    const newSnappedX = Math.round(targetX / gridSize) * gridSize;
    const newSnappedY = Math.round(targetY / gridSize) * gridSize;
    
    // Calculate the snapped delta to apply to all other components to keep relative positions
    const snappedDx = newSnappedX - primaryInitial.x;
    const snappedDy = newSnappedY - primaryInitial.y;

    const updates: { id: string, updates: Partial<CircuitComponent> }[] = [];

    dragState.initialPositions.forEach((initial, compId) => {
        updates.push({
            id: compId,
            updates: {
                x: initial.x + snappedDx,
                y: initial.y + snappedDy
            }
        });
    });

    if (updates.length > 0) {
        updateComponents(updates);
    }
  }, [dragState, activeTool, gridSize, updateComponents]);

  const endMove = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    startMove,
    updateMove,
    endMove,
    isMoving: !!dragState
  };
};
