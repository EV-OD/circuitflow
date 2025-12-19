
export const PREFIX_REGISTRY: Record<string, string> = {
    'resistor': 'R',
    'capacitor': 'C',
    'inductor': 'L',
    'diode': 'D',
    'voltage_dc': 'V',
    'current_dc': 'I',
    'gnd': 'GND',
    'nmos': 'Q',
    'pmos': 'Q',
    'transistor_npn': 'Q',
    'transistor_pnp': 'Q',
    '2n2222': 'Q',
    '2n3906': 'Q',
    'lm741': 'U',
    // Generic fallback handled in generator
};

export const getPrefixForType = (type: string, symbol?: string): string => {
    if (PREFIX_REGISTRY[type]) return PREFIX_REGISTRY[type];
    
    // Heuristics based on symbol if type not explicitly registered
    if (symbol?.includes('source')) return 'V';
    if (symbol?.includes('transistor')) return 'Q';
    if (symbol === 'generic') return 'U';
    
    // Fallback: First letter of type, uppercase
    return type.charAt(0).toUpperCase();
};
