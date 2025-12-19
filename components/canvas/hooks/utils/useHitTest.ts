
import { useCallback } from 'react';
import { CircuitComponent, ComponentDefinition, NetlistResult } from '../../../../types';
import { COMPONENT_LIBRARY, GRID_SIZE } from '../../../../constants';
import { getProjectedPortPosition } from '../../../../services/circuitUtils';

interface UseHitTestProps {
    components: CircuitComponent[];
    customDefinitions: ComponentDefinition[];
    lastNetlistResult: NetlistResult | null;
}

export const useHitTest = ({ components, customDefinitions, lastNetlistResult }: UseHitTestProps) => {
    
    const getPortPosition = useCallback((compId: string, portId: string) => {
        const comp = components.find(c => c.id === compId);
        if (!comp) return null;
        
        // Use Projected Position for Wiring Interactions
        return getProjectedPortPosition(
            comp, 
            portId, 
            [...COMPONENT_LIBRARY, ...customDefinitions],
            GRID_SIZE
        );
    }, [components, customDefinitions]);

    const findHitObject = useCallback((x: number, y: number): { type: 'component' | 'node', id: string, subId?: string } | null => {
        const hitRadius = 15;

        // Check Ports
        for (const comp of components) {
            const def = COMPONENT_LIBRARY.find(c => c.type === comp.definitionType) || 
                        customDefinitions.find(c => c.type === comp.definitionType);
            if (def) {
                for (const port of def.ports) {
                    const rad = (comp.rotation * Math.PI) / 180;
                    const rx = port.x * Math.cos(rad) - port.y * Math.sin(rad);
                    const ry = port.x * Math.sin(rad) + port.y * Math.cos(rad);
                    const px = comp.x + rx;
                    const py = comp.y + ry;
                    if (Math.hypot(px - x, py - y) < hitRadius) {
                        return { type: 'node', id: comp.id, subId: port.id };
                    }
                }
            }
        }
        
        // Check Body
        for (const comp of components) {
            // Simple bounding box check (approximate 40x40 area around center)
            if (x > comp.x - 20 && x < comp.x + 20 && y > comp.y - 20 && y < comp.y + 20) {
                return { type: 'component', id: comp.id };
            }
        }
        return null;
    }, [components, customDefinitions]);

    const getSpiceNodeName = useCallback((id: string, subId: string): string | null => {
        if (!lastNetlistResult) return null;
        const key = `${id}:${subId}`;
        return lastNetlistResult.nodeMap.get(key) || null;
    }, [lastNetlistResult]);

    const getSpiceComponentName = useCallback((id: string): string | null => {
        if (!lastNetlistResult) return null;
        return lastNetlistResult.componentMap.get(id) || null;
    }, [lastNetlistResult]);

    return {
        getPortPosition,
        findHitObject,
        getSpiceNodeName,
        getSpiceComponentName
    };
};
