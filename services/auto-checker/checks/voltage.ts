
import { DesignIssue, DesignRuleCheck } from '../types';

export const checkVoltageSources: DesignRuleCheck = (components) => {
    const issues: DesignIssue[] = [];

    components.forEach(c => {
        if (c.definitionType === 'voltage_dc') {
            const vStr = c.properties['voltage'] || '0';
            // Simple parsing to find big numbers
            const val = parseFloat(vStr);
            if (!isNaN(val) && Math.abs(val) > 1000) {
                issues.push({
                    id: `hv-${c.id}`,
                    rule: 'High Voltage',
                    severity: 'info',
                    message: `${c.designator} set to ${vStr}. Verify high voltage safety.`,
                    componentId: c.id
                });
            }
        }
    });

    return issues;
};
