export const createSeriesCircuitTool = {
    name: "createSeriesCircuit",
    description: "Creates a complete series circuit template with a power source and specified components. Use this to build the circuit in one step instead of adding components individually.",
    parameters: {
        type: "OBJECT",
        properties: {
            components: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of component types in order (e.g., ['resistor', 'resistor', 'led'])"
            },
            sourceVoltage: {
                type: "NUMBER",
                description: "Voltage of the power source (default 9V)"
            }
        },
        required: ["components"]
    }
};

export const createParallelCircuitTool = {
    name: "createParallelCircuit",
    description: "Creates a complete parallel circuit template. Connects components in parallel branches across a source.",
    parameters: {
        type: "OBJECT",
        properties: {
            branches: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Component type for each parallel branch"
            },
            sourceVoltage: {
                type: "NUMBER",
                description: "Voltage of the power source"
            }
        },
        required: ["branches"]
    }
};

export const createVoltageDividerTool = {
    name: "createVoltageDivider",
    description: "Quickly creates a voltage divider circuit with a source and two resistors.",
    parameters: {
        type: "OBJECT",
        properties: {
            sourceVoltage: { type: "NUMBER" },
            r1Value: { type: "NUMBER", description: "Resistance of top resistor" },
            r2Value: { type: "NUMBER", description: "Resistance of bottom resistor" }
        },
        required: ["sourceVoltage", "r1Value", "r2Value"]
    }
};

export const batchModifyPropertiesTool = {
    name: "batchModifyProperties",
    description: "Updates properties for multiple components simultaneously to reduce API calls.",
    parameters: {
        type: "OBJECT",
        properties: {
            updates: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        componentId: { type: "STRING" },
                        property: { type: "STRING", description: "e.g., 'resistance', 'voltage', 'capacitance'" },
                        value: { type: "NUMBER" }
                    }
                }
            }
        },
        required: ["updates"]
    }
};
