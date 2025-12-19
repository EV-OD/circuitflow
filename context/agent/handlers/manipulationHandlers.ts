
import { CircuitComponent, Wire } from '../../../types';

interface ManipulationContextRefs {
    components: CircuitComponent[];
    wires: Wire[];
}

interface ManipulationActions {
    updateComponent: (id: string, updates: Partial<CircuitComponent>) => void;
}

// Helper to find component by Designator (preferred) or ID
const findComponent = (identifier: string, components: CircuitComponent[]) => {
    return components.find(c => c.designator === identifier || c.id === identifier);
};

export const handleRotateComponent = (args: any, actions: ManipulationActions, refs: ManipulationContextRefs) => {
    const comp = findComponent(args.designator, refs.components);
    if (comp) {
        const newRotation = (comp.rotation + 90) % 360;
        actions.updateComponent(comp.id, { rotation: newRotation });
        return { message: `Rotated ${comp.designator} to ${newRotation}°.` };
    }
    return { error: `Component '${args.designator}' not found.` };
};

export const handleMoveComponent = (args: any, actions: ManipulationActions, refs: ManipulationContextRefs) => {
    const comp = findComponent(args.designator, refs.components);
    if (comp) {
        actions.updateComponent(comp.id, { x: args.x, y: args.y });
        return { message: `Moved ${comp.designator} to (${args.x}, ${args.y}).` };
    }
    return { error: `Component '${args.designator}' not found.` };
};
