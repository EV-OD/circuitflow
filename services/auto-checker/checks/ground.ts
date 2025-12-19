
import { DesignIssue, DesignRuleCheck } from '../types';

export const checkGround: DesignRuleCheck = (components) => {
    const hasGround = components.some(c => c.definitionType === 'gnd');
    
    if (!hasGround) {
        return [{
            id: 'missing-ground',
            rule: 'Ground Reference',
            severity: 'error',
            message: 'No Ground (GND) component found. Simulation requires a 0V reference.'
        }];
    }
    return [];
};
