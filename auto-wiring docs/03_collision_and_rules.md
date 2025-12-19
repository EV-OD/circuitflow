
# Collision Detection & Routing Rules

Before the A* search begins, the system builds a "Cost Map" of the current circuit state to identify obstacles.

## 1. The Collision Map
We identify three types of areas on the grid:

### A. Hard Barriers (Blocked)
*   **Definition**: Areas strictly forbidden for wires.
*   **Source**: The physical body of components and the specific locations of *other* pins.
*   **Implementation**: 
    *   We calculate a Bounding Box around every component.
    *   Any grid point inside this box is added to a `blockedNodes` Set.
    *   **Exception**: The specific Start and End points of the current route are explicitly *removed* from the block list, ensuring connectivity is possible even if the pin is technically "inside" the component boundary.

### B. Soft Barriers (Penalized)
*   **Definition**: Areas allowed but discouraged (high cost).
*   **Source**: A padding zone (1 grid unit) surrounding every Hard Barrier.
*   **Purpose**: Prevents wires from grazing directly against a component body, creating visual breathing room.

### C. Existing Wires (Crossings)
*   **Definition**: Grid points occupied by other wires.
*   **Purpose**: We track these to apply a `CROSSING_PENALTY`. This encourages the new wire to find a path that doesn't clutter existing connections, but allows it to cross if that is the only/shortest viable option.

## 2. Directional Stubs
Schematic wires should not exit a component at an arbitrary angle. They should exit perpendicular to the pin orientation.

*   **Logic**: 
    1.  Determine the vector of the start/end pins (e.g., a resistor on the X-axis has pins pointing Left and Right).
    2.  Force the pathfinder to start at `Start + Vector` and end at `End + Vector`.
    3.  This creates a "stub" ensuring the wire leaves the component cleanly before turning.

## 3. Post-Processing: Simplification
The raw output from A* is a dense array of every single grid point along the path (e.g., `[(0,0), (20,0), (40,0)...]`).

**The Simplifier (`simplifier.ts`)**:
1.  Iterates through the point list.
2.  Removes intermediate points that are collinear.
3.  **Example**: `(0,0) -> (20,0) -> (40,0) -> (40,20)` becomes `(0,0) -> (40,0) -> (40,20)`.
4.  This reduces the data to just the "Corners", which significantly improves SVG rendering performance and makes the wire easier to edit later.
