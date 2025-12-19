
import { ComponentData, Wire } from './types';
import { toGrid, getKey } from './geometry';
import { WIRE_HORIZONTAL, WIRE_VERTICAL } from './astar';

/**
 * Generates the Collision/Cost Map and Wire Occupancy Map.
 * @param bufferSize The number of grid cells around a component to treat as "Hard Walls".
 */
export const generateMaps = (obstacles: ComponentData[], existingWires: Wire[], bufferSize: number) => {
  const costMap = new Map<string, number>();
  const wireOccupancy = new Map<string, number>();

  // 1. Add Components (Hard Barriers & Hard Buffers)
  obstacles.forEach(comp => {
    // Component Bounds (Grid Units)
    const startX = comp.x;
    const startY = comp.y;
    const endX = comp.x + comp.width;
    const endY = comp.y + comp.height;

    // Use dynamic buffer size
    for (let x = startX - bufferSize; x < endX + bufferSize; x++) {
      for (let y = startY - bufferSize; y < endY + bufferSize; y++) {
        const key = getKey(x, y);
        
        // Inside component or in buffer? -> Blocked (Infinity)
        costMap.set(key, Infinity);
      }
    }
  });

  // 2. Add Existing Wires (Occupancy for Overlap Checks)
  existingWires.forEach(wire => {
    if (!wire.points || wire.points.length === 0) return;
    for (let i = 0; i < wire.points.length - 1; i++) {
        const p1 = wire.points[i];
        const p2 = wire.points[i+1];
        
        const g1 = { x: toGrid(p1.x), y: toGrid(p1.y) };
        const g2 = { x: toGrid(p2.x), y: toGrid(p2.y) };

        // Horizontal Segment
        if (g1.y === g2.y) {
            const minX = Math.min(g1.x, g2.x);
            const maxX = Math.max(g1.x, g2.x);
            for(let x=minX; x<=maxX; x++) {
                const key = getKey(x, g1.y);
                wireOccupancy.set(key, (wireOccupancy.get(key) || 0) | WIRE_HORIZONTAL);
            }
        } 
        // Vertical Segment
        else {
            const minY = Math.min(g1.y, g2.y);
            const maxY = Math.max(g1.y, g2.y);
            for(let y=minY; y<=maxY; y++) {
                const key = getKey(g1.x, y);
                wireOccupancy.set(key, (wireOccupancy.get(key) || 0) | WIRE_VERTICAL);
            }
        }
    }
  });

  return { costMap, wireOccupancy };
};
