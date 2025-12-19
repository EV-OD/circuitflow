
# Pathfinding Algorithm: A* (A-Star)

The core routing engine uses the **A* Search Algorithm**, which is widely used in pathfinding because it guarantees finding the shortest path (given a heuristic) while being more efficient than Dijkstra's algorithm.

## The Graph
The "world" is treated as a grid graph where:
*   **Nodes**: Intersection points on the 20px grid (`GRID_SIZE`).
*   **Edges**: Connections between adjacent grid points (Up, Down, Left, Right).

## Cost Function
A* selects paths by minimizing $f(n) = g(n) + h(n)$.

### 1. Actual Cost ($g(n)$)
The cost to reach a specific node from the start. We heavily tune this to produce "schematic-like" wires.

| Action | Cost Value | Reason |
| :--- | :--- | :--- |
| **Base Move** | 10 | Cost to move 1 grid unit. |
| **Turn Penalty** | 500 | **Crucial**. A massive penalty is applied whenever the direction changes (e.g., Horizontal -> Vertical). This forces the algorithm to explore long straight lines before considering a turn, reducing "staircase" artifacts. |
| **Crossing Wire** | 300 | Penalty for entering a grid point already occupied by another wire. We allow crossings if necessary, but prefer clear space. |
| **Proximity** | 150 | "Soft" penalty for moving immediately adjacent to a component (padding zone). |

### 2. Heuristic ($h(n)$)
We use the **Manhattan Distance** ($|dx| + |dy|$) because movement is restricted to grid axes. 

*   **Tie-Breaking**: The heuristic is multiplied by a small factor (`1.01`) to break ties in open space. This makes the algorithm slightly "greedy," preferring paths that visually move towards the target, significantly improving performance in empty areas.

## Implementation Details (`astar.ts`)
*   **Spatial Hashing**: Nodes are stored in a `Map<string, Node>` using keys formatted as `"x,y"`. This allows O(1) lookups for collision checking and closed-set membership.
*   **Direction Tracking**: Each node stores the `direction` (Horizontal/Vertical) of the incoming edge. This allows us to detect turns and apply the `TURN_PENALTY`.
*   **Iteration Limit**: A hard cap (e.g., 4000 iterations) prevents browser freezes if a target is unreachable (e.g., completely walled off). In such cases, it falls back to a direct straight line.
