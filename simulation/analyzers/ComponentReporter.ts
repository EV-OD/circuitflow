
import { SimulationRunResult } from '../types';
import { getComponentDetails } from '../analysis';
import { calculateMax, calculateAverage, integrate, multiplySeries } from '../utils/math';
import { findCrossings } from '../utils/events';
import { ComponentDefinition } from '../../types';

export interface ReportItem {
    label: string;
    value: number | string;
    unit?: string;
    description?: string;
    status?: 'normal' | 'warning' | 'danger';
}

export interface ComponentReport {
    componentId: string;
    componentName: string;
    metrics: ReportItem[];
    events: string[];
}

/**
 * Generates a specialized analysis report for a specific component based on its type and simulation data.
 */
export const generateComponentReport = (
    result: SimulationRunResult,
    componentId: string,
    definition: ComponentDefinition,
    customDefinitions: ComponentDefinition[] = []
): ComponentReport => {
    const { data } = result;
    
    // Safety check for empty data
    if (!data || !data.data || data.data.length === 0) {
        return {
            componentId,
            componentName: definition.label,
            metrics: [{ label: 'Status', value: 'No Data', status: 'warning' }],
            events: ['Simulation produced no data points.']
        };
    }

    // Determine Time Axis
    const time = data.data.map(row => row[0]); // Assume index 0 is time/sweep
    
    // Check if variables exist before accessing index 0 to prevent crash
    const isTransient = data.variables.length > 0 && 
                       (data.variables[0]?.toLowerCase() === 'time' || data.analysisType?.toLowerCase().includes('transient'));

    // Get Raw Electrical Data (V, I arrays)
    const electricals = getComponentDetails(
        result, 
        '', // Internal designator lookup handled by ID
        componentId, 
        definition.type, 
        customDefinitions
    );

    const report: ComponentReport = {
        componentId,
        componentName: definition.label,
        metrics: [],
        events: []
    };

    // Helper to add metric
    const addMetric = (label: string, val: number, unit: string, limit?: number) => {
        let status: ReportItem['status'] = 'normal';
        let desc = '';
        
        // Handle NaNs or Infinity
        if (!isFinite(val)) val = 0;

        if (limit !== undefined && limit > 0) {
            const ratio = Math.abs(val) / limit;
            if (ratio > 1.0) {
                status = 'danger';
                desc = `Exceeds limit (${limit}${unit})`;
            } else if (ratio > 0.8) {
                status = 'warning';
                desc = `Near limit (${limit}${unit})`;
            }
        }

        report.metrics.push({
            label,
            value: val.toExponential(3),
            unit,
            description: desc,
            status
        });
    };

    // --- GENERIC POWER ANALYSIS ---
    // Try to find generic V and I keys if specific model logic didn't provide derived power
    const vKey = Object.keys(electricals).find(k => k.startsWith('Voltage') || k.startsWith('V_ds') || k.startsWith('V_ce'));
    const iKey = Object.keys(electricals).find(k => k.startsWith('Current') || k.startsWith('I_d') || k.startsWith('I_c'));

    if (vKey && iKey) {
        const V = electricals[vKey];
        const I = electricals[iKey];
        
        // Ensure arrays exist and have data
        if (V && I && V.length > 0 && I.length > 0) {
            // Absolute P = |V * I| for safety checks
            const P = multiplySeries(V, I);
            const AbsP = P.map(Math.abs);
            
            const maxP = calculateMax(AbsP);
            const avgP = calculateAverage(AbsP); // Average of magnitude for dissipation check
            
            const pMaxLimit = definition.datasheet?.p_max;

            addMetric('Max Power Dissipation', maxP, 'W', pMaxLimit);
            
            if (isTransient) {
                addMetric('Average Power', avgP, 'W');
                const Energy = integrate(time, AbsP);
                addMetric('Energy Consumed', Energy, 'J');
            }
        }
    }

    // --- COMPONENT SPECIFIC ANALYSIS ---

    // 1. MOSFET Analysis
    if (definition.type === 'nmos' || definition.type === 'pmos' || definition.symbol === 'transistor_nmos') {
        const Vgs = electricals['V_gs (V)'];
        const Vds = electricals['V_ds (V)'];
        const Id = electricals['I_d (A)'];

        if (Vds && Vds.length) addMetric('Max Vds', calculateMax(Vds.map(Math.abs)), 'V', definition.datasheet?.v_max);
        if (Id && Id.length) addMetric('Max Id', calculateMax(Id.map(Math.abs)), 'A', definition.datasheet?.i_max);

        // Event: Turning On (Vgs crossing threshold)
        if (Vgs && Vgs.length && isTransient) {
            const vth = 1.0; // Assume generic Vth if not in properties
            const crossings = findCrossings(time, Vgs, vth);
            crossings.forEach(e => {
                report.events.push(`Gate triggered (${e.type}) at ${e.time.toExponential(3)}s`);
            });
        }
    }

    // 2. BJT Analysis
    else if (definition.symbol.includes('transistor_')) {
        const Ic = electricals['I_c (A)'];
        const Vce = electricals['V_ce (V)'];
        
        if (Ic && Ic.length) addMetric('Max Collector Current', calculateMax(Ic.map(Math.abs)), 'A', definition.datasheet?.i_max);
        if (Vce && Vce.length) addMetric('Max Vce', calculateMax(Vce.map(Math.abs)), 'V', definition.datasheet?.v_max);
    }

    // 3. Resistor Analysis
    else if (definition.type === 'resistor') {
        const V = electricals['Voltage (V)'];
        if (V && V.length) addMetric('Max Voltage Drop', calculateMax(V.map(Math.abs)), 'V', definition.datasheet?.v_max);
    }

    // 4. Capacitor Analysis
    else if (definition.type === 'capacitor') {
        const V = electricals['Voltage (V)'];
        if (V && V.length) {
            const maxV = calculateMax(V.map(Math.abs));
            addMetric('Max Voltage Stress', maxV, 'V', definition.datasheet?.v_max);
            
            // Percentage charged
            const rating = definition.datasheet?.v_max || 16;
            report.events.push(`Peak charge: ${((maxV / rating) * 100).toFixed(1)}% of rating`);
        }
    }

    return report;
};
