
# Auto-Wiring System Overview

The CircuitFlow auto-wiring system is designed to intelligently route wires between electronic components on a grid-based canvas. Unlike simple straight-line connections, it produces orthogonal (Manhattan style) paths that mimic professional schematic layouts.

## Goals
1.  **Orthogonality**: Wires only move horizontally or vertically.
2.  **Obstacle Avoidance**: Wires automatically route around components to avoid overlapping symbols.
3.  **Aesthetics**: The system prioritizes long straight segments and minimizes the number of turns (corners).
4.  **Performance**: Routing must be fast enough for real-time interaction during drag-and-drop operations.

## Architecture
The system is built as a standalone service located in `services/auto-wiring/`. It is stateless and functional, taking a `RouteRequest` object describing the world state and returning a set of points defining the wire path.

### Core Modules
*   **`index.ts`**: The entry point. Handles coordinate snapping, collision map generation, and orchestrates the pathfinding.
*   **`astar.ts`**: A specialized implementation of the A* search algorithm optimized for grid grids.
*   **`cost.ts`**: Defines the "weights" or penalties for different actions (moving, turning, crossing), which dictates the "personality" of the wire.
*   **`geometry.ts`**: Utilities for grid snapping, bounding box calculation, and spatial hashing.
*   **`simplifier.ts`**: Post-processing step to reduce the dense grid path into a minimal set of SVG polyline points.

---

## Usage
The auto-wiring is triggered automatically when:
1.  A user completes a connection using the "Wire" tool (if endpoints are not aligned).
2.  The AI Agent (`connect_components` tool) requests a connection between two components.
3.  The "Redesign Wiring" feature is used to recalculate existing paths.
