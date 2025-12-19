
export interface DesignIssue {
    id: string; // unique string for keying
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    componentId?: string; // If specific to a component
    location?: { x: number, y: number }; // For focusing
}

export type DesignRuleCheck = (
    components: any[], 
    wires: any[], 
    definitions: any[]
) => DesignIssue[];
