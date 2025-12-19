import { Point } from './types';

/**
 * Removes collinear points to reduce path density.
 * e.g. (0,0) -> (20,0) -> (40,0) becomes (0,0) -> (40,0)
 */
export const simplifyPath = (points: Point[]): Point[] => {
  if (points.length < 3) return points;

  const simplified: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Check if moving in same direction (horizontal)
    const sameHorizontal = prev.y === curr.y && curr.y === next.y;
    // Check if moving in same direction (vertical)
    const sameVertical = prev.x === curr.x && curr.x === next.x;

    if (!sameHorizontal && !sameVertical) {
      simplified.push(curr);
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
};