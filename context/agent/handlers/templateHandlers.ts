import { CircuitActions, CircuitContextRefs, getComponentDefinition } from './utils';
import { COMPONENT_ALIASES } from './circuitHandlers';
import { CircuitComponent } from '../../../types';

const resolveType = (type: string) => COMPONENT_ALIASES[type] || type;

const getPorts = (type: string, refs: CircuitContextRefs) => {
    const def = getComponentDefinition(type, refs);
    return def?.ports || [];
};

export const handleCreateSeriesCircuit = (
    args: any,
    actions: CircuitActions,
    refs: CircuitContextRefs,
    batchComponents: CircuitComponent[]
) => {
    const components = args.components || [];
    const voltage = args.sourceVoltage || 9;
    
    // Start position
    const startX = 200;
    const startY = 300;
    const spacing = 150;

    // 1. Create Source
    const source = actions.addComponent('voltage_dc', startX, startY);
    if (!source) return { error: "Failed to create source" };
    
    actions.updateComponent(source.id, { 
        properties: { ...source.properties, voltage: `${voltage}V` } 
    });
    batchComponents.push(source);

    const createdComponents: CircuitComponent[] = [source];
    
    // 2. Create Components
    let currentX = startX + spacing;
    for (const type of components) {
        const resolved = resolveType(type);
        const comp = actions.addComponent(resolved, currentX, startY);
        if (comp) {
            // Rotate if needed? Default is usually fine for horizontal chain
            createdComponents.push(comp);
            batchComponents.push(comp);
            currentX += spacing;
        }
    }

    // 3. Wire them
    // Source is index 0.
    // Source Plus -> Comp 1 Input
    // Comp 1 Output -> Comp 2 Input
    // ...
    // Comp N Output -> Source Minus

    const sourcePorts = getPorts('voltage_dc', refs);
    const plusPort = sourcePorts.find(p => p.id === 'plus') || sourcePorts[0];
    const minusPort = sourcePorts.find(p => p.id === 'minus') || sourcePorts[1];

    let previousComp = source;
    let previousPortId = plusPort.id;

    // Iterate through passive components
    for (let i = 1; i < createdComponents.length; i++) {
        const currentComp = createdComponents[i];
        const currentPorts = getPorts(currentComp.type, refs);
        
        // Assume Port 0 is Input (Left/Top), Port 1 is Output (Right/Bottom)
        // For Diode: a (0), k (1)
        const inputPort = currentPorts[0];
        const outputPort = currentPorts[1];

        // Connect Previous Output to Current Input
        actions.addWire({
            fromComp: previousComp.id,
            fromPort: previousPortId,
            toComp: currentComp.id,
            toPort: inputPort.id,
            points: [] 
        });

        previousComp = currentComp;
        previousPortId = outputPort.id;
    }

    // Close the loop: Last Component Output -> Source Minus
    actions.addWire({
        fromComp: previousComp.id,
        fromPort: previousPortId,
        toComp: source.id,
        toPort: minusPort.id,
        points: []
    });

    return { 
        message: `Created series circuit with ${components.length} components.`,
        components: createdComponents.map(c => c.id)
    };
};

export const handleCreateParallelCircuit = (
    args: any,
    actions: CircuitActions,
    refs: CircuitContextRefs,
    batchComponents: CircuitComponent[]
) => {
    const branches = args.branches || [];
    const voltage = args.sourceVoltage || 9;

    const startX = 200;
    const startY = 300;
    const spacing = 100;

    // 1. Source
    const source = actions.addComponent('voltage_dc', startX, startY);
    if (!source) return { error: "Failed to create source" };
    actions.updateComponent(source.id, { properties: { ...source.properties, voltage: `${voltage}V` } });
    batchComponents.push(source);

    const sourcePorts = getPorts('voltage_dc', refs);
    const plusPort = sourcePorts.find(p => p.id === 'plus')!;
    const minusPort = sourcePorts.find(p => p.id === 'minus')!;

    // 2. Branches
    let currentX = startX + spacing;
    
    for (const type of branches) {
        const resolved = resolveType(type);
        // Place component
        // Rotate 90 degrees to be vertical (parallel to source)
        const comp = actions.addComponent(resolved, currentX, startY);
        if (comp) {
            actions.updateComponent(comp.id, { rotation: 90 });
            batchComponents.push(comp);

            const ports = getPorts(resolved, refs);
            // After rotation 90:
            // Port 1 (Left) -> Top
            // Port 2 (Right) -> Bottom
            // So Port 1 connects to Source Plus (Top)
            // Port 2 connects to Source Minus (Bottom)

            actions.addWire({
                fromComp: source.id,
                fromPort: plusPort.id,
                toComp: comp.id,
                toPort: ports[0].id,
                points: [] 
            });

            actions.addWire({
                fromComp: source.id,
                fromPort: minusPort.id,
                toComp: comp.id,
                toPort: ports[1].id,
                points: []
            });

            currentX += spacing;
        }
    }

    return { message: `Created parallel circuit with ${branches.length} branches.` };
};

export const handleCreateVoltageDivider = (
    args: any,
    actions: CircuitActions,
    refs: CircuitContextRefs,
    batchComponents: CircuitComponent[]
) => {
    // Source, R1, R2
    const voltage = args.sourceVoltage || 9;
    const r1Val = args.r1Value || 1000;
    const r2Val = args.r2Value || 1000;

    const startX = 200;
    const startY = 300;

    const source = actions.addComponent('voltage_dc', startX, startY);
    if (!source) return { error: "Failed" };
    actions.updateComponent(source.id, { properties: { ...source.properties, voltage: `${voltage}V` } });
    batchComponents.push(source);

    // R1 (Top)
    const r1 = actions.addComponent('resistor', startX + 100, startY - 50);
    if (r1) {
        actions.updateComponent(r1.id, { rotation: 90, properties: { ...r1.properties, resistance: `${r1Val}` } });
        batchComponents.push(r1);
    }

    // R2 (Bottom)
    const r2 = actions.addComponent('resistor', startX + 100, startY + 50);
    if (r2) {
        actions.updateComponent(r2.id, { rotation: 90, properties: { ...r2.properties, resistance: `${r2Val}` } });
        batchComponents.push(r2);
    }

    if (source && r1 && r2) {
        const sPorts = getPorts('voltage_dc', refs);
        const rPorts = getPorts('resistor', refs); // [1, 2]

        // Source Plus -> R1 Top (1)
        actions.addWire({ fromComp: source.id, fromPort: sPorts[0].id, toComp: r1.id, toPort: rPorts[0].id, points: [] });
        
        // R1 Bottom (2) -> R2 Top (1)
        actions.addWire({ fromComp: r1.id, fromPort: rPorts[1].id, toComp: r2.id, toPort: rPorts[0].id, points: [] });

        // R2 Bottom (2) -> Source Minus
        actions.addWire({ fromComp: r2.id, fromPort: rPorts[1].id, toComp: source.id, toPort: sPorts[1].id, points: [] });
    }

    return { message: "Voltage divider created." };
};

export const handleBatchModifyProperties = (
    args: any,
    actions: CircuitActions,
    refs: CircuitContextRefs
) => {
    const updates = args.updates || [];
    let count = 0;
    for (const update of updates) {
        const { componentId, property, value } = update;
        const comp = refs.components.find(c => c.id === componentId || c.designator === componentId);
        if (comp) {
            actions.updateComponent(comp.id, {
                properties: { ...comp.properties, [property]: value }
            });
            count++;
        }
    }
    return { message: `Updated ${count} components.` };
};
