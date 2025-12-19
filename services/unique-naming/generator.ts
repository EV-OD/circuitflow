
import { CircuitComponent, ComponentDefinition } from '../../types';
import { getPrefixForType } from './registry';

export const generateDesignator = (
    type: string, 
    existingComponents: CircuitComponent[],
    definitions: ComponentDefinition[]
): string => {
    const def = definitions.find(d => d.type === type);
    const prefix = getPrefixForType(type, def?.symbol);

    // Filter components that share the same prefix
    const samePrefixComps = existingComponents.filter(c => c.designator && c.designator.startsWith(prefix));

    // Find the max number used
    let maxNum = 0;
    samePrefixComps.forEach(c => {
        const numPart = c.designator.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });

    return `${prefix}${maxNum + 1}`;
};
