
import { Wire, CircuitComponent, ComponentDefinition } from '../../types';

export interface Point {
    x: number;
    y: number;
}

export interface RouteRequest {
    start: Point;
    end: Point;
    startDirection?: Point;
    endDirection?: Point;
    components: CircuitComponent[];
    definitions: ComponentDefinition[];
    existingWires: Wire[];
    gridSize?: number;
    padding?: number;
}

export type Direction = 'top' | 'bottom' | 'left' | 'right';

export interface ComponentData {
    id: string;
    x: number; // Grid units
    y: number; // Grid units
    width: number; // Grid units
    height: number; // Grid units
    type: string;
}

export interface PathRequest {
    start: Point; // Pixels
    end: Point; // Pixels
    startDirection?: Point; // Vector
    endDirection?: Point; // Vector
    startPortId?: string;
    endPortId?: string;
    existingWires: Wire[];
    obstacles: ComponentData[];
    gridSize?: number;
}

export interface VersionInfo {
    id: string;
    version: string;
    title: string;
    date: string;
    description: string;
}

export interface DebugRect {
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string;
    label?: string;
}

export interface SubSquare {
    x: number;
    y: number;
    size: number;
    id: string;
}
