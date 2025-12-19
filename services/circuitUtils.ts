
import { CircuitComponent, ComponentDefinition, XY } from '../types';

export const calculatePortPosition = (
    component: CircuitComponent, 
    portId: string, 
    library: ComponentDefinition[]
): XY | null => {
    const def = library.find(d => d.type === component.definitionType);
    if (!def) return null;
    
    const port = def.ports.find(p => p.id === portId);
    if (!port) return null;

    const rad = (component.rotation * Math.PI) / 180;
    return {
        x: component.x + (port.x * Math.cos(rad) - port.y * Math.sin(rad)),
        y: component.y + (port.x * Math.sin(rad) + port.y * Math.cos(rad))
    };
};

export const getComponentDefaultOrientation = (
    definitionType: string,
    library: ComponentDefinition[]
): 'horizontal' | 'vertical' => {
    const def = library.find(d => d.type === definitionType);
    if (!def || def.ports.length < 2) return 'horizontal'; // Default

    // Heuristic: Check spread of ports
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    def.ports.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    // If wider than tall -> Horizontal
    return rangeX >= rangeY ? 'horizontal' : 'vertical';
};

export const getPortDirection = (
    component: CircuitComponent,
    portId: string,
    library: ComponentDefinition[]
): XY => {
    const def = library.find(d => d.type === component.definitionType);
    if (!def) return { x: 0, y: 0 };

    const port = def.ports.find(p => p.id === portId);
    if (!port) return { x: 0, y: 0 };

    // Determine local direction based on position relative to center (0,0)
    // Heuristic: If port is significantly displaced in X, it points X. Else Y.
    // This assumes ports are on the perimeter.
    // (Right: +1, Left: -1, Bottom: +1, Top: -1)
    let dx = 0, dy = 0;
    
    if (Math.abs(port.x) > Math.abs(port.y)) {
        dx = Math.sign(port.x);
    } else {
        dy = Math.sign(port.y);
    }

    // Apply Component Rotation (Clockwise)
    // 0: (dx, dy)
    // 90: (-dy, dx)
    // 180: (-dx, -dy)
    // 270: (dy, -dx)
    
    const rot = (component.rotation % 360 + 360) % 360; // Normalize
    
    let rx = dx, ry = dy;

    if (rot === 90) { 
        rx = -dy; ry = dx;
    } else if (rot === 180) {
        rx = -dx; ry = -dy;
    } else if (rot === 270) {
        rx = dy; ry = -dx;
    }

    return { x: rx, y: ry };
};

export const getProjectedPortPosition = (
    component: CircuitComponent,
    portId: string,
    library: ComponentDefinition[],
    gridSize: number = 10
): XY | null => {
    const pos = calculatePortPosition(component, portId, library);
    if (!pos) return null;

    // No projection - return exact port position
    // This ensures the wire connects exactly to the symbol pin
    return pos;
};