
import { CircuitComponent, ComponentDefinition, Wire, VirtualGrid } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';

export interface CircuitContextRefs {
    components: CircuitComponent[];
    wires: Wire[];
    customDefinitions: ComponentDefinition[];
    grids?: VirtualGrid[];
}

export interface CircuitActions {
    addComponent: (type: string, x: number, y: number) => CircuitComponent | null;
    deleteComponent: (id: string) => void;
    addWire: (wire: Omit<Wire, 'id'>) => void;
    updateComponent: (id: string, updates: Partial<CircuitComponent>) => void;
}

// Helper to find component by Designator (preferred) or ID
export const findComponent = (identifier: string, components: CircuitComponent[]) => {
    return components.find(c => c.designator === identifier || c.id === identifier);
};

export const getComponentDefinition = (type: string, refs: CircuitContextRefs) => {
    return COMPONENT_LIBRARY.find(c => c.type === type) || 
           refs.customDefinitions.find(c => c.type === type);
};
