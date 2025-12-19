
import { CircuitComponent } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { calculatePortPosition, getPortDirection } from '../../../services/circuitUtils';
import { findAutoWirePath } from '../../../services/auto-wiring';
import { calculateGridPosition } from '../../../services/grid';
import { findComponent, getComponentDefinition, CircuitActions, CircuitContextRefs } from './utils';

const COMPONENT_ALIASES: Record<string, string> = {
    'voltage_pulse': 'source_pulse',
    'pulse_source': 'source_pulse',
    'sq_wave': 'source_pulse',
    'current_source': 'current_dc',
    'dc_current': 'current_dc',
    'voltage_source': 'voltage_dc',
    'dc_voltage': 'voltage_dc',
    'res': 'resistor',
    'cap': 'capacitor',
    'ind': 'inductor',
    'npn': 'transistor_npn',
    'pnp': 'transistor_pnp',
    'nmos': 'nmos',
    'pmos': 'pmos'
};

export const handleAddComponent = (
    args: any, 
    actions: CircuitActions, 
    refs: CircuitContextRefs,
    batchComponents: CircuitComponent[]
) => {
    // Validate Grid Requirements
    if (!args.grid_id) {
        return { error: "Missing 'grid_id'. You must create a layout grid first using 'create_layout_grid'." };
    }

    const grid = refs.grids?.find(g => g.id === args.grid_id);
    if (!grid) {
        return { error: `Grid '${args.grid_id}' not found. Available grids: ${(refs.grids || []).map(g => g.id).join(', ')}` };
    }
    
    // Strict Parameter Check (though schema enforces it, safety first)
    if (args.row === undefined || args.col === undefined || !args.edge) {
        return { 
            error: "Grid placement requires 'row', 'col', and 'edge' parameters.",
            hint: "Valid edges: 'top', 'bottom', 'left', 'right'."
        };
    }

    // Resolve Aliases
    let componentType = args.type;
    if (COMPONENT_ALIASES[componentType]) {
        componentType = COMPONENT_ALIASES[componentType];
    }

    const allDefs = [...COMPONENT_LIBRARY, ...refs.customDefinitions];
    
    // Check if valid
    if (!allDefs.some(d => d.type === componentType)) {
        const available = allDefs.map(d => d.type).join(', ');
        return { error: `Component type '${args.type}' not found. Did you mean: ${available}?` };
    }
    
    // Calculate Position based on Grid
    const placement = calculateGridPosition(
        grid, 
        args.row, 
        args.col, 
        args.edge, 
        componentType,
        allDefs
    );

    const { x, y, rotation } = placement;
    
    // Create Component
    const newComponent = actions.addComponent(componentType, x, y);
    
    if (newComponent) {
        // Apply rotation from grid calculation
        if (rotation !== 0) {
            actions.updateComponent(newComponent.id, { rotation });
        }

        // Apply properties if provided
        if (args.properties) {
            actions.updateComponent(newComponent.id, { 
                properties: { ...newComponent.properties, ...args.properties } 
            });
        }

        batchComponents.push(newComponent);

        const def = getComponentDefinition(componentType, refs);
        const validPorts = def?.ports.map(p => p.id).join(', ') || 'unknown';

        return { 
            message: `Added ${componentType} at Grid(${args.row},${args.col}) [${args.edge}].`,
            tip: `Valid ports for this component are: [${validPorts}]`,
            designator: newComponent.designator,
            id: newComponent.id
        };
    }
    return { error: "Failed to add component internally." };
};

export const handleDeleteComponent = (args: any, actions: CircuitActions, refs: CircuitContextRefs) => {
    const comp = findComponent(args.designator || args.id, refs.components);
    if (comp) {
        actions.deleteComponent(comp.id);
        return { message: `Deleted component ${comp.designator}` };
    }
    return { error: `Component '${args.designator || args.id}' not found.` };
};

export const handleConnectComponents = (
    args: any, 
    actions: CircuitActions, 
    refs: CircuitContextRefs, 
    batchComponents: CircuitComponent[]
) => {
    const allComponents = [...refs.components, ...batchComponents];
    const allDefinitions = [...COMPONENT_LIBRARY, ...refs.customDefinitions];

    const sourceKey = args.source || args.sourceId;
    const targetKey = args.target || args.targetId;

    const sourceComp = findComponent(sourceKey, allComponents);
    const targetComp = findComponent(targetKey, allComponents);

    if (sourceComp && targetComp) {
        const start = calculatePortPosition(sourceComp, args.sourcePort, allDefinitions);
        const end = calculatePortPosition(targetComp, args.targetPort, allDefinitions);

        if (start && end) {
            // Calculate directions
            const startDirection = getPortDirection(sourceComp, args.sourcePort, allDefinitions);
            const endDirection = getPortDirection(targetComp, args.targetPort, allDefinitions);

            const points = findAutoWirePath({
                start, 
                end, 
                startDirection,
                endDirection,
                components: allComponents, 
                definitions: allDefinitions,
                existingWires: refs.wires 
            });

            actions.addWire({
                sourceComponentId: sourceComp.id,
                sourcePortId: args.sourcePort,
                destComponentId: targetComp.id,
                destPortId: args.targetPort,
                points
            });
            return { message: `Connected ${sourceComp.designator}:${args.sourcePort} to ${targetComp.designator}:${args.targetPort}` };
        } else {
            const srcDef = getComponentDefinition(sourceComp.definitionType, refs);
            const tgtDef = getComponentDefinition(targetComp.definitionType, refs);
            const srcPorts = srcDef?.ports.map(p => p.id).join(', ');
            const tgtPorts = tgtDef?.ports.map(p => p.id).join(', ');
            
            return { 
                error: "Invalid ports.",
                details: `${sourceComp.designator} valid ports: [${srcPorts}]. ${targetComp.designator} valid ports: [${tgtPorts}].`
            };
        }
    } else {
        return { error: `Components not found. Looked for ${sourceKey} and ${targetKey}.` };
    }
};

export const handleGetCircuitState = (
    refs: CircuitContextRefs, 
    batchComponents: CircuitComponent[]
) => {
    const compMap = new Map<string, CircuitComponent>();
    refs.components.forEach(c => compMap.set(c.id, c));
    batchComponents.forEach(c => compMap.set(c.id, c));
    
    const allComponents = Array.from(compMap.values());
    
    const compData = allComponents.map(c => {
        const def = getComponentDefinition(c.definitionType, refs);
        return {
            designator: c.designator, 
            type: c.definitionType,
            pos: [c.x, c.y, c.rotation],
            ports: def?.ports.map(p => p.id) || [],
            properties: c.properties
        };
    });
    
    const connectionData = refs.wires.map(w => {
        const src = allComponents.find(c => c.id === w.sourceComponentId)?.designator || w.sourceComponentId;
        const dst = allComponents.find(c => c.id === w.destComponentId)?.designator || w.destComponentId;
        return `${src}:${w.sourcePortId} <-> ${dst}:${w.destPortId}`;
    });
    
    // Include Grids in the state for the agent
    const gridData = refs.grids?.map(g => `Grid ${g.id}: ${g.rows}x${g.cols} @ (${g.x},${g.y})`);

    return {
        components: compData,
        connections: connectionData,
        grids: gridData
    };
};
