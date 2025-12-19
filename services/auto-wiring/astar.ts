
import { Point } from './types';
import { COSTS, HEURISTIC_MULTIPLIER } from './cost';
import { getKey } from './geometry';

// Direction vectors for neighbor exploration
const MOVES = [
  { x: 0, y: -1 }, // Up
  { x: 0, y: 1 },  // Down
  { x: -1, y: 0 }, // Left
  { x: 1, y: 0 },  // Right
];

// Bitmasks for wire orientation
export const WIRE_HORIZONTAL = 1;
export const WIRE_VERTICAL = 2;

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: Node | null;
  // Direction we arrived FROM to reach this node (dx, dy)
  arrivalDir: { x: number, y: number } | null; 
}

interface PathOptions {
    allowCollinear: boolean;
}

// Custom Priority Queue for performance (MinHeap)
class MinHeap {
  private heap: Node[] = [];

  push(node: Node) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): Node | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].f <= this.heap[index].f) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let swap = -1;

      if (left < length && this.heap[left].f < this.heap[index].f) {
        swap = left;
      }
      if (right < length) {
        if ((swap === -1 && this.heap[right].f < this.heap[index].f) ||
            (swap !== -1 && this.heap[right].f < this.heap[swap].f)) {
          swap = right;
        }
      }

      if (swap === -1) break;
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }

  get length() { return this.heap.length; }
}

const heuristic = (a: Point, b: Point) => {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * HEURISTIC_MULTIPLIER;
};

// Standard A*
export const findAStarPath = (
  startGrid: Point,
  endGrid: Point,
  costMap: Map<string, number>, // Static costs (obstacles, padding)
  wireOccupancy: Map<string, number>, // 1 = Horiz, 2 = Vert
  startDir: Point, // Forced start direction
  options: PathOptions = { allowCollinear: false }
): Point[] => {
  const openSet = new MinHeap();
  const gScores = new Map<string, number>(); 

  const startNode: Node = {
    x: startGrid.x,
    y: startGrid.y,
    g: 0,
    h: heuristic(startGrid, endGrid),
    f: heuristic(startGrid, endGrid),
    parent: null,
    arrivalDir: startDir 
  };

  openSet.push(startNode);
  gScores.set(`${startGrid.x},${startGrid.y},${startDir.x},${startDir.y}`, 0);

  let iterations = 0;
  const MAX_ITERATIONS = 50000; 

  while (openSet.length > 0) {
    iterations++;
    const current = openSet.pop();
    if (!current) break;

    if (iterations > MAX_ITERATIONS) break;

    if (current.x === endGrid.x && current.y === endGrid.y) {
      const path: Point[] = [];
      let temp: Node | null = current;
      while (temp) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }
    
    for (const move of MOVES) {
      const nx = current.x + move.x;
      const ny = current.y + move.y;
      const nKey = getKey(nx, ny);

      const cellCost = costMap.get(nKey);
      if (cellCost === Infinity) continue;

      const occupancy = wireOccupancy.get(nKey) || 0;
      let isOverlap = false;
      let isCrossing = false;
      let overlapPenalty = 0;

      if (move.x !== 0) {
        if (occupancy & WIRE_HORIZONTAL) {
            if (options.allowCollinear) overlapPenalty = 100000;
            else isOverlap = true;
        }
        if (occupancy & WIRE_VERTICAL) isCrossing = true;
      }
      else if (move.y !== 0) {
        if (occupancy & WIRE_VERTICAL) {
             if (options.allowCollinear) overlapPenalty = 100000;
             else isOverlap = true;
        }
        if (occupancy & WIRE_HORIZONTAL) isCrossing = true;
      }

      if (isOverlap) continue; 

      let newG = current.g + COSTS.BASE_MOVE;
      if (cellCost) newG += cellCost;
      if (isCrossing) newG += COSTS.CROSSING_WIRE;
      newG += overlapPenalty;

      if (current.arrivalDir && (current.arrivalDir.x !== move.x || current.arrivalDir.y !== move.y)) {
        newG += COSTS.TURN_PENALTY;
      }

      const h = heuristic({ x: nx, y: ny }, endGrid);
      const neighborStateKey = `${nx},${ny},${move.x},${move.y}`;

      if (!gScores.has(neighborStateKey) || newG < (gScores.get(neighborStateKey) || Infinity)) {
        gScores.set(neighborStateKey, newG);
        openSet.push({
          x: nx,
          y: ny,
          g: newG,
          h: h,
          f: newG + h,
          parent: current,
          arrivalDir: move
        });
      }
    }
  }

  return []; 
};

// Bi-Directional A*
export const findBiDirectionalAStarPath = (
  startGrid: Point,
  endGrid: Point,
  costMap: Map<string, number>,
  wireOccupancy: Map<string, number>,
  allowedNodes: Set<string> | null, // If present, only these nodes are valid
  options: PathOptions = { allowCollinear: false }
): Point[] => {
  const openStart = new MinHeap();
  const openEnd = new MinHeap();
  
  const gStart = new Map<string, number>();
  const gEnd = new Map<string, number>();
  
  const parentsStart = new Map<string, Node>();
  const parentsEnd = new Map<string, Node>();

  // Init Start
  const startNode: Node = { x: startGrid.x, y: startGrid.y, g: 0, h: heuristic(startGrid, endGrid), f: 0, parent: null, arrivalDir: {x:0, y:0} };
  openStart.push(startNode);
  const startKey = getKey(startGrid.x, startGrid.y);
  gStart.set(startKey, 0);
  parentsStart.set(startKey, startNode);

  // Init End
  const endNode: Node = { x: endGrid.x, y: endGrid.y, g: 0, h: heuristic(endGrid, startGrid), f: 0, parent: null, arrivalDir: {x:0, y:0} };
  openEnd.push(endNode);
  const endKey = getKey(endGrid.x, endGrid.y);
  gEnd.set(endKey, 0);
  parentsEnd.set(endKey, endNode);

  let meetingNodeKey: string | null = null;
  let iterations = 0;
  const MAX_ITERATIONS = 30000;

  const expandNode = (current: Node, isOpenStart: boolean) => {
      const gScores = isOpenStart ? gStart : gEnd;
      const otherGScores = isOpenStart ? gEnd : gStart;
      const openSet = isOpenStart ? openStart : openEnd;
      const parents = isOpenStart ? parentsStart : parentsEnd;
      const target = isOpenStart ? endGrid : startGrid;

      const currentKey = getKey(current.x, current.y);

      // Check for meeting
      if (otherGScores.has(currentKey)) {
          meetingNodeKey = currentKey;
          return true; // Met!
      }

      for (const move of MOVES) {
          const nx = current.x + move.x;
          const ny = current.y + move.y;
          const nKey = getKey(nx, ny);

          // Corridor Constraint Check
          if (allowedNodes && !allowedNodes.has(nKey)) continue;

          const cellCost = costMap.get(nKey);
          if (cellCost === Infinity) continue;

          // Wire checks
          const occupancy = wireOccupancy.get(nKey) || 0;
          let isOverlap = false;
          let isCrossing = false;
          
          if (move.x !== 0) {
            if (occupancy & WIRE_HORIZONTAL) {
                if (!options.allowCollinear) isOverlap = true;
            }
            if (occupancy & WIRE_VERTICAL) isCrossing = true;
          } else {
            if (occupancy & WIRE_VERTICAL) {
                if (!options.allowCollinear) isOverlap = true;
            }
            if (occupancy & WIRE_HORIZONTAL) isCrossing = true;
          }
          if (isOverlap) continue;

          let newG = current.g + COSTS.BASE_MOVE;
          if (cellCost) newG += cellCost;
          if (isCrossing) newG += COSTS.CROSSING_WIRE;
          // Note: Turn penalty is harder in bi-directional without tracking direction state in map keys properly.
          // Simplified: Add turn penalty if arrivalDir changes
          if (current.arrivalDir && (current.arrivalDir.x !== 0 || current.arrivalDir.y !== 0)) {
             if (current.arrivalDir.x !== move.x || current.arrivalDir.y !== move.y) {
                 newG += COSTS.TURN_PENALTY;
             }
          }

          if (!gScores.has(nKey) || newG < (gScores.get(nKey) || Infinity)) {
              gScores.set(nKey, newG);
              const h = heuristic({x:nx, y:ny}, target);
              const nextNode: Node = {
                  x: nx, y: ny, g: newG, h, f: newG + h,
                  parent: current,
                  arrivalDir: move
              };
              openSet.push(nextNode);
              parents.set(nKey, nextNode);
          }
      }
      return false;
  };

  while(openStart.length > 0 && openEnd.length > 0) {
      iterations++;
      if (iterations > MAX_ITERATIONS) break;

      // Expand Start
      const currStart = openStart.pop();
      if (currStart && expandNode(currStart, true)) break;

      // Expand End
      const currEnd = openEnd.pop();
      if (currEnd && expandNode(currEnd, false)) break;
  }

  if (meetingNodeKey) {
      // Reconstruct path
      const path: Point[] = [];
      
      // Start -> Meeting
      let curr = parentsStart.get(meetingNodeKey);
      while(curr) {
          path.push({x: curr.x, y: curr.y});
          curr = curr.parent;
      }
      path.reverse(); // Now it is Start -> Meeting

      // Meeting -> End
      curr = parentsEnd.get(meetingNodeKey);
      if (curr) curr = curr.parent; // Skip meeting node itself to avoid duplicate
      while(curr) {
          path.push({x: curr.x, y: curr.y});
          curr = curr.parent;
      }
      
      return path;
  }

  return [];
};
