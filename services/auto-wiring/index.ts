
import { PathRequest, Point, VersionInfo, RouteRequest, ComponentData } from './types';
import { AVAILABLE_VERSIONS, ROUTING_STRATEGIES } from './registry';
import { routeWireV1_4_3 } from './versions/v1.4.3';
import { GRID_SIZE } from '../../constants';
import { calculatePortPosition, getPortDirection } from '../circuitUtils';

// Re-export available versions for UI
export { AVAILABLE_VERSIONS };

export const routeWire = (request: PathRequest, version: string = '1.6.1'): Point[] => {
  const strategy = ROUTING_STRATEGIES[version];
  
  if (strategy) {
      return strategy(request);
  }

  // Default fallback if version not found
  console.warn(`Version ${version} not found, falling back to default (1.4.3).`);
  return routeWireV1_4_3(request);
};

export const findAutoWirePath = (request: RouteRequest): Point[] => {
    const gridSize = request.gridSize || GRID_SIZE;

    const obstacles: ComponentData[] = [];
    
    request.components.forEach(comp => {
        const def = request.definitions.find(d => d.type === comp.definitionType);
        if (!def) return;

        // Calculate Bounding Box from Ports
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let hasPorts = false;

        def.ports.forEach(port => {
            const pos = calculatePortPosition(comp, port.id, request.definitions);
            if (pos) {
                hasPorts = true;
                minX = Math.min(minX, pos.x);
                maxX = Math.max(maxX, pos.x);
                minY = Math.min(minY, pos.y);
                maxY = Math.max(maxY, pos.y);
            }
        });

        if (!hasPorts) return;

        // Convert to Grid Units
        let width, height, x, y;
        const PADDING = 1; // 1 Grid Unit Padding

        if (def.ports.length === 1) {
             // Single port component (GND, VCC, etc)
             // The bounding box should be the component body, not the port.
             // We assume the body is "behind" the port.
             const portId = def.ports[0].id;
             const portDir = getPortDirection(comp, portId, request.definitions);
             
             // Shift center away from port direction by 2.5 grid units (50px)
             // This places the obstacle at Grid Y+2 relative to port (Grid Y).
             // The buffer (size 1) will cover Grid Y+1 (Component Body).
             // This leaves Grid Y (Port) completely free of buffer, allowing side access.
             const cx = minX - (portDir.x * 2.5 * gridSize);
             const cy = minY - (portDir.y * 2.5 * gridSize);
             
             // Use a size that covers the component width (approx 1.5 grid units)
             const size = gridSize * 1.5; 
             const halfSize = size / 2;
             
             const gx1 = Math.floor((cx - halfSize) / gridSize);
             const gx2 = Math.ceil((cx + halfSize) / gridSize);
             const gy1 = Math.floor((cy - halfSize) / gridSize);
             const gy2 = Math.ceil((cy + halfSize) / gridSize);
             
             const localPadding = 0; // No extra padding for single port
             x = gx1 - localPadding;
             y = gy1 - localPadding;
             width = (gx2 - gx1) + (localPadding * 2);
             height = (gy2 - gy1) + (localPadding * 2);
        } else if (def.ports.length === 2) {
             // 2-port component (Resistor, Capacitor, etc)
             // Strategy: Define a "Body Rect" in pixels that covers the component symbol
             // but stops short of the ports (Inner Padding).
             // Then identify which Grid Nodes fall inside this rect.

             const isHorizontal = (maxX - minX) > (maxY - minY);
             
             // 1. Define Body Rect (Pixels)
             // Start with the bounding box of the ports
             let bodyMinX = minX;
             let bodyMaxX = maxX;
             let bodyMinY = minY;
             let bodyMaxY = maxY;

             const INNER_PADDING = gridSize / 2; // 10px
             const THICKNESS = gridSize / 2;     // 10px expansion from center (Total 20px)

             if (isHorizontal) {
                 // Contract Axis (X) to avoid blocking ports
                 bodyMinX += INNER_PADDING;
                 bodyMaxX -= INNER_PADDING;
                 
                 // Expand Thickness (Y) to cover symbol height
                 const cy = (minY + maxY) / 2;
                 bodyMinY = cy - THICKNESS;
                 bodyMaxY = cy + THICKNESS;
             } else {
                 // Contract Axis (Y)
                 bodyMinY += INNER_PADDING;
                 bodyMaxY -= INNER_PADDING;
                 
                 // Expand Thickness (X)
                 const cx = (minX + maxX) / 2;
                 bodyMinX = cx - THICKNESS;
                 bodyMaxX = cx + THICKNESS;
             }

             // 2. Convert to Grid Nodes
             // We block any node that is "inside" this body rect.
             // Since nodes are at (0,0), (20,0)... 
             // A node N is inside if bodyMin <= N*grid <= bodyMax
             // N >= bodyMin/grid  -> ceil
             // N <= bodyMax/grid  -> floor
             
             const gx1 = Math.ceil(bodyMinX / gridSize);
             const gx2 = Math.floor(bodyMaxX / gridSize);
             const gy1 = Math.ceil(bodyMinY / gridSize);
             const gy2 = Math.floor(bodyMaxY / gridSize);

             // 3. Set Obstacle
             // Note: We do NOT add extra PADDING here because we want precise control.
             // The 'maps.ts' will add buffer for the "Strict" pass, which is fine.
             
             x = gx1;
             y = gy1;
             width = Math.max(0, gx2 - gx1 + 1);
             height = Math.max(0, gy2 - gy1 + 1);
             
        } else {
            // Complex component - use bounding box
            const gx1 = Math.floor(minX / gridSize);
            const gx2 = Math.ceil(maxX / gridSize);
            const gy1 = Math.floor(minY / gridSize);
            const gy2 = Math.ceil(maxY / gridSize);
            
            x = gx1 - PADDING;
            y = gy1 - PADDING;
            width = (gx2 - gx1) + (PADDING * 2);
            height = (gy2 - gy1) + (PADDING * 2);
        }

        obstacles.push({
            id: comp.id,
            type: comp.definitionType,
            x,
            y,
            width,
            height
        });
    });

    // --- Project Start/End Points to Padded Boundary ---
    // NOTE: The input request.start and request.end are ALREADY projected 
    // because getPortPosition in useHitTest now returns the projected point.
    // So we don't need to manually project them again here.

    const pathReq: PathRequest = {
        start: request.start,
        end: request.end,
        startDirection: request.startDirection,
        endDirection: request.endDirection,
        existingWires: request.existingWires,
        obstacles: obstacles,
        gridSize: gridSize
    };

    const path = routeWire(pathReq, '1.6.1');

    // Return path directly (no stitching needed as start/end are already projected)
    return path;
};
