
import { DesignIssue, DesignRuleCheck } from '../types';

export const checkFloatingNodes: DesignRuleCheck = (components, wires, definitions) => {
    const issues: DesignIssue[] = [];
    const connectedPorts = new Set<string>();

    wires.forEach(w => {
        connectedPorts.add(`${w.sourceComponentId}:${w.sourcePortId}`);
        connectedPorts.add(`${w.destComponentId}:${w.destPortId}`);
    });

    components.forEach(c => {
        const def = definitions.find(d => d.type === c.definitionType);
        if (def) {
            def.ports.forEach((p: any) => {
                if (!connectedPorts.has(`${c.id}:${p.id}`)) {
                    issues.push({
                        id: `floating-${c.id}-${p.id}`,
                        rule: 'Unconnected Node',
                        severity: 'warning',
                        message: `Pin '${p.id}' on ${c.designator} is floating.`,
                        componentId: c.id,
                        location: { x: c.x, y: c.y }
                    });
                }
            });
        }
    });

    return issues;
};
