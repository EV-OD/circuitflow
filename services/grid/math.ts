
import { VirtualGrid, CircuitComponent, ComponentDefinition } from '../../types';
import { getComponentDefaultOrientation } from '../circuitUtils';
import { GRID_SIZE } from '../../constants';

export type GridEdge = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface GridPositionResult {
    x: number;
    y: number;
    rotation: number;
}

export const calculateGridPosition = (
    grid: VirtualGrid,
    row: number,
    col: number,
    edge: string,
    componentType: string,
    definitions: ComponentDefinition[]
): GridPositionResult => {
    const { x: originX, y: originY, spacing } = grid;
    const edgeLower = edge.toLowerCase() as GridEdge;
    
    let targetX = 0;
    let targetY = 0;
    
    // Horizontal edges imply horizontal component orientation preference
    const isHorizontalEdge = edgeLower === 'top' || edgeLower === 'bottom' || edgeLower === 'center';

    // Calculate Center Position based on Edge of the cell (row, col)
    // Note: We use the raw calculations first, then SNAP at the end.
    if (edgeLower === 'top') {
        targetX = originX + (col + 0.5) * spacing;
        targetY = originY + row * spacing;
    } else if (edgeLower === 'bottom') {
        targetX = originX + (col + 0.5) * spacing;
        targetY = originY + (row + 1) * spacing;
    } else if (edgeLower === 'left') {
        targetX = originX + col * spacing;
        targetY = originY + (row + 0.5) * spacing;
    } else if (edgeLower === 'right') {
        targetX = originX + (col + 1) * spacing;
        targetY = originY + (row + 0.5) * spacing;
    } else {
        // Center
        targetX = originX + (col + 0.5) * spacing;
        targetY = originY + (row + 0.5) * spacing;
    }

    // CRITICAL: Snap to Canvas GRID_SIZE (20px) to prevent pins falling in between
    targetX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
    targetY = Math.round(targetY / GRID_SIZE) * GRID_SIZE;

    // Determine Rotation
    const defaultOrientation = getComponentDefaultOrientation(componentType, definitions);
    const requiredOrientation = isHorizontalEdge ? 'horizontal' : 'vertical';
    
    let targetRotation = 0;
    if (defaultOrientation !== requiredOrientation) {
        targetRotation = 90;
    }

    return { x: targetX, y: targetY, rotation: targetRotation };
};
