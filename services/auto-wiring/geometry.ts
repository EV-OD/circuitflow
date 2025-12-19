
import { GRID_SIZE } from '../../constants';
import { Point, Direction } from './types';

// Converts pixel coordinate to grid coordinate
export const toGrid = (val: number): number => Math.round(val / GRID_SIZE);

// Converts grid coordinate to pixel coordinate
export const toPixel = (val: number): number => val * GRID_SIZE;

// Spatial hashing key
export const getKey = (x: number, y: number): string => `${x},${y}`;

// Get vector for direction
export const getDirectionVector = (dir: Direction | Point | undefined): Point => {
  if (!dir) return { x: 0, y: 0 };
  if (typeof dir === 'object') return dir; // It's already a Point

  switch (dir) {
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    default: return { x: 0, y: 0 };
  }
};

// Check if two directions are perpendicular (turn)
export const isTurn = (dir1: Point, dir2: Point): boolean => {
  return (dir1.x !== dir2.x) || (dir1.y !== dir2.y);
};

// --- v1.3 Geometry Helpers ---

const distance = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

/**
 * Finds the closest point on a line segment (A-B) to a point P.
 * Ensures the result is snapped to the Grid.
 */
export const getClosestPointOnSegment = (p: Point, a: Point, b: Point): Point => {
  // Since wires are orthogonal, we handle horizontal and vertical separately
  const isHorizontal = a.y === b.y;
  const isVertical = a.x === b.x;

  let closest: Point = { x: 0, y: 0 };

  if (isHorizontal) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    // Clamp P.x between minX and maxX
    const clampedX = Math.max(minX, Math.min(p.x, maxX));
    closest = { x: clampedX, y: a.y };
  } else if (isVertical) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    // Clamp P.y between minY and maxY
    const clampedY = Math.max(minY, Math.min(p.y, maxY));
    closest = { x: a.x, y: clampedY };
  } else {
    // Should not happen in orthogonal routing, but fallback to A
    closest = a;
  }

  return closest;
};
