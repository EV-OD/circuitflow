
# Grid System & Geometry

The foundation of the auto-wiring system is the discrete coordinate grid.

## The Grid
*   **Resolution (`GRID_SIZE`)**: **20 pixels**.
*   All calculations are performed in World Coordinates, not Screen Coordinates.

## Snapping Logic
To ensure wires align perfectly with pins, inputs must be quantized.

### Standard Snapping
$$ x_{snapped} = \text{round}(x / 20) \times 20 $$

### Smart Snapping (Directional)
When a start/end point is slightly off-grid (e.g., due to floating point drift or manual placement), standard rounding might snap it "behind" the pin direction, causing the wire to visually backtrack through the component.

**Smart Snap Strategy**:
*   If the pin points **Right** (+X), we use `ceil()` to snap to the next grid line *forward*.
*   If the pin points **Left** (-X), we use `floor()` to snap to the next grid line *backward*.
*   This ensures the wire always visually connects "outward" from the component.

## Bounding Boxes
For collision detection, components are approximated as rectangles.

1.  **Pin scanning**: We look at the min/max X and Y of all pins on a component.
2.  **Inflation**: We inflate this box by `GRID_SIZE` to define the component body.
3.  **Rasterization**: We iterate from `min` to `max` in steps of 20px, adding every coordinate to the spatial hash map.

## Spatial Hashing
Since JavaScript/TypeScript `Set` and `Map` compare objects by reference, we cannot store `{x: 20, y: 20}` directly.
We use a string key generator:
```typescript
const getKey = (x: number, y: number) => `${x},${y}`;
```
This allows $O(1)$ access to check `blockedNodes.has("100,200")`.
