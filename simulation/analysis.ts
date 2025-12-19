
import { SimulationRunResult } from './types';
import { ensureVariable } from '../services/VariableManager';
import { normalizeVar } from '../services/VariableManager/Normalizers';
import { getModelForComponent } from './models/ModelRegistry';
import { COMPONENT_LIBRARY } from '../constants';

/**
 * Retrieves specific electrical details for a component using its simulation model.
 * Returns a dictionary of labeled data series (e.g. { "Vce": [...], "Ic": [...] })
 */
export const getComponentDetails = (
    result: SimulationRunResult,
    designator: string,
    componentId: string,
    componentType: string,
    customDefinitions: any[] = []
) => {
    const { data, netlistInfo } = result;
    
    // 1. Get Spice Name
    const spiceName = netlistInfo.componentMap.get(componentId);
    if (!spiceName) return {};

    // 2. Get Model
    const model = getModelForComponent(componentType);
    if (!model) return {};

    // 3. Resolve Node Map
    // We need to map Port ID (e.g. "c") to Spice Node (e.g. "2")
    const nodeMap = new Map<string, string>();
    const allDefs = [...COMPONENT_LIBRARY, ...customDefinitions];
    const def = allDefs.find(d => d.type === componentType);
    
    if (def) {
        def.ports.forEach(p => {
            const key = `${componentId}:${p.id}`;
            const spiceNode = netlistInfo.nodeMap.get(key);
            if (spiceNode) {
                nodeMap.set(p.id, spiceNode);
            }
        });
    }

    // 4. Delegate to Model
    // First, ensure all required probes are present in the data (synthesize if needed)
    // The generator should have added them, but synthesis might handle missing diff voltages.
    
    // Note: ensureVariable works on 'data' but 'getData' expects the processed data.
    // However, 'getData' logic inside models often calls calculateDiff/getSeries which handle raw access.
    // If complex synthesis is needed, it should be done here or inside the model.
    // For now, assume data contains the raw probes requested by `getProbes`.

    return model.getData(
        { componentId, spiceName, nodes: nodeMap },
        data
    );
};

// Keep old function for backward compatibility / basic use, but wrapper it or deprecate
export const getComponentElectricals = (
    result: SimulationRunResult,
    designator: string
) => {
    // This function was used for single V/I pairs. 
    // We can try to map the new detailed output to this simple structure 
    // or just return the first voltage/current found.
    
    // Find component ID by designator
    let compId: string | undefined;
    for (const [id, name] of result.netlistInfo.componentMap.entries()) {
        if (name === designator) {
            compId = id;
            break;
        }
    }

    if (!compId) return { voltage: null, current: null, voltageVarName: '', currentVarName: '' };

    // We don't easily know the type here without passing components list.
    // For now, return empty or try a fallback if needed.
    // Ideally, the caller should use `getComponentDetails`.
    
    return { voltage: null, current: null, voltageVarName: '', currentVarName: '' };
};

/**
 * Returns formatted table data for a given X-axis and multiple Y-axes.
 */
export const getTableData = (
    result: SimulationRunResult,
    xAxisVar: string,
    yAxisVars: string[]
) => {
    if (!result || !result.data) return null;
    let processedData = result.data;
    
    // Ensure all variables exist
    [xAxisVar, ...yAxisVars].forEach(v => {
        if (v) processedData = ensureVariable(processedData, v);
    });

    const xIdx = processedData.variables.findIndex(v => normalizeVar(v) === normalizeVar(xAxisVar));
    const yIndices = yAxisVars.map(y => processedData.variables.findIndex(v => normalizeVar(v) === normalizeVar(y)));

    if (xIdx === -1) return null;

    const rows = processedData.data.map(row => {
        return [row[xIdx], ...yIndices.map(i => i !== -1 ? row[i] : NaN)];
    });

    return {
        headers: [xAxisVar, ...yAxisVars],
        rows
    };
};
