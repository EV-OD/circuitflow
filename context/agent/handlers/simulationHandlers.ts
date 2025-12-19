
import { CircuitComponent, ComponentDefinition, Wire } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { generateSpiceNetlist } from '../../../services/netlistGenerator';
import { simulationService } from '../../../services/simulationService';

interface SimulationContextRefs {
    components: CircuitComponent[];
    wires: Wire[];
    customDefinitions: ComponentDefinition[];
}

interface SimulationActions {
    setSimulationResults: (data: any, netlistRes: any) => void;
    setIsSimOverlayOpen: (open: boolean) => void;
}

export const handleAnalyzeCircuit = async (
    args: any, 
    actions: SimulationActions, 
    refs: SimulationContextRefs,
    batchComponents: CircuitComponent[]
) => {
    const allComponents = [...refs.components, ...batchComponents];
    const allDefinitions = [...COMPONENT_LIBRARY, ...refs.customDefinitions];
    
    const valueOverrides = new Map<string, Record<string, string>>();
    let directive = '';
    
    // 1. Process Overrides (Modifications)
    if (args.modifications && Array.isArray(args.modifications)) {
        args.modifications.forEach((mod: any) => {
            const existing = valueOverrides.get(mod.componentId) || {};
            existing[mod.property] = mod.value;
            valueOverrides.set(mod.componentId, existing);
        });
    }

    // 2. Process AC Source
    if (args.acSource) {
        const existing = valueOverrides.get(args.acSource.componentId) || {};
        existing['ac_magnitude'] = '1';
        existing['ac_phase'] = '0';
        valueOverrides.set(args.acSource.componentId, existing);
    }

    // 3. Process Sweeps
    let sweepDirective = '';
    if (args.sweepParam) {
        const paramName = 'VAL';
        const { componentId, property, start, end, step } = args.sweepParam;
        const existing = valueOverrides.get(componentId) || {};
        existing[property] = `{${paramName}}`;
        valueOverrides.set(componentId, existing);
        sweepDirective = `.step param ${paramName} ${start} ${end} ${step}`;
    }

    // 4. Set Directives
    if (args.analysisType === 'TRAN') {
        directive = `.TRAN 10us ${args.stopTime || '10ms'} 0`;
    } else if (args.analysisType === 'DC') {
        directive = `.DC ${args.source || 'V1'} ${args.start || '0'} ${args.stop || '5'} ${args.step || '0.1'}`;
    } else if (args.analysisType === 'AC') {
        directive = `.AC DEC ${args.acPoints || 10} ${args.acStart || '10Hz'} ${args.acStop || '1MHz'}`;
    } else if (args.analysisType === 'OP') {
        directive = '.OP';
    }

    let finalDirective = directive;
    if (sweepDirective) finalDirective += `\n${sweepDirective}`;
    if (args.extraDirectives) finalDirective += `\n${args.extraDirectives}`;

    // 5. Auto Instrumentation (Dry Run)
    const dryRunRes = generateSpiceNetlist(
        allComponents, 
        refs.wires, 
        'DryRun', 
        '', 
        allDefinitions,
        valueOverrides,
        true 
    );

    const { componentMap, nodeMap, currentProbes } = dryRunRes;
    const measLines: string[] = [];

    // 6. Generate .meas statements for QA
    allComponents.forEach(comp => {
        const spiceRef = componentMap.get(comp.id);
        if (!spiceRef) return;

        const getN = (portId: string) => {
            const key = `${comp.id}:${portId}`;
            return nodeMap.get(key) || '0';
        };

        const getI = (portId?: string) => {
            if (portId && currentProbes?.has(`${comp.id}:${portId}`)) {
                return `I(${currentProbes.get(`${comp.id}:${portId}`)})`;
            }
            return `I(${spiceRef})`;
        };

        // Current Measurement
        measLines.push(`.meas tran ${spiceRef}_I_max MAX ${getI()}`);
        
        // Power/Voltage checks based on component type
        if (comp.definitionType === 'resistor') {
            const n1 = getN('1');
            const n2 = getN('2');
            measLines.push(`.meas tran ${spiceRef}_P_max MAX V(${n1},${n2})*${getI()}`);
        }
        else if (comp.definitionType === 'capacitor') {
            const n1 = getN('1');
            const n2 = getN('2');
            measLines.push(`.meas tran ${spiceRef}_V_max MAX V(${n1},${n2})`);
        }
        else if (['nmos', 'pmos'].includes(comp.definitionType)) {
            const nd = getN('d');
            const ns = getN('s');
            const ng = getN('g');
            measLines.push(`.meas tran ${spiceRef}_Vds_max MAX V(${nd},${ns})`);
            measLines.push(`.meas tran ${spiceRef}_Vgs_max MAX V(${ng},${ns})`);
            measLines.push(`.meas tran ${spiceRef}_P_inst MAX V(${nd},${ns})*${getI()}`);
        }
    });

    if (args.analysisType === 'TRAN') {
        finalDirective += `\n\n* --- QA MEASUREMENTS ---\n${measLines.join('\n')}`;
    }

    // 7. Generate Final Netlist
    const netlistRes = generateSpiceNetlist(
        allComponents, 
        refs.wires, 
        'AgentSim', 
        finalDirective, 
        allDefinitions,
        valueOverrides,
        true 
    );
    
    // 8. Run Simulation
    try {
        const data = await simulationService.runSimulation(netlistRes.netlist);
        
        if (data) {
            actions.setSimulationResults(data, netlistRes);
            actions.setIsSimOverlayOpen(true);
            
            const datasheetMap: Record<string, any> = {};
            allComponents.forEach(c => {
                const def = allDefinitions.find(d => d.type === c.definitionType);
                if (def?.datasheet) {
                    const ref = componentMap.get(c.id);
                    if (ref) datasheetMap[ref] = def.datasheet;
                }
            });

            return { 
                success: true, 
                measurements: data.measurements || {}, 
                datasheets: datasheetMap,
                note: "Simulation complete. Datasheets and Measurements attached for analysis."
            };
        } else {
            return { success: false, error: "Simulation produced no data." };
        }
    } catch (e: any) {
        console.error("Simulation Engine Error:", e);
        return { success: false, error: `Simulation failed: ${e.message}` };
    }
};
