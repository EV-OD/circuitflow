
import { VirtualGrid } from '../../../types';
import { GRID_SIZE } from '../../../constants';

export const handleCreateLayoutGrid = (
    args: any,
    actions: { addGrid: (g: VirtualGrid) => void },
) => {
    // Snap all dimensions to prevent off-grid issues.
    // CRITICAL: Spacing must be a multiple of 40 (2 * GRID_SIZE).
    // This ensures that the midpoint (spacing / 2) is a multiple of 20 (GRID_SIZE).
    // If spacing was 60 (3*20), midpoint is 30, which is OFF the 20px grid.
    // If spacing is 80 (4*20), midpoint is 40, which is ON the 20px grid.
    const DOUBLE_GRID = GRID_SIZE * 2;
    const rawSpacing = args.spacing || 120; 
    const spacing = Math.max(DOUBLE_GRID, Math.round(rawSpacing / DOUBLE_GRID) * DOUBLE_GRID);
    
    const x = Math.round((args.x || 0) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((args.y || 0) / GRID_SIZE) * GRID_SIZE;

    // Generate a short ID for easier referencing (e.g. g42)
    const shortId = `g${Math.floor(Math.random() * 1000)}`;
    
    const newGrid: VirtualGrid = {
        id: shortId,
        x: x,
        y: y,
        rows: args.rows,
        cols: args.cols,
        spacing: spacing
    };

    actions.addGrid(newGrid);
    return { 
        message: `Grid created. ID: ${shortId} (${args.rows}x${args.cols}, spacing: ${spacing})`,
        grid_id: shortId 
    };
};
