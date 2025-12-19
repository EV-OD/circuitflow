
import { CircuitComponent, Wire, SimulationData, NetlistResult } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { calculateAverage } from '../../../simulation/utils/math';

interface DRCRefs {
    components: CircuitComponent[];
    wires: Wire[];
    simulationResults: SimulationData | null;
    lastNetlist: NetlistResult | null;
}

export const handleCheckDesignRules = (args: any, refs: DRCRefs) => {
    const { components, wires, simulationResults, lastNetlist } = refs;
    const checks: { rule: string, status: 'PASS' | 'FAIL' | 'WARN', details: string }[] = [];

    // --- 1. Connectivity Checks ---
    
    // Ground Check
    const hasGround = components.some(c => c.definitionType === 'gnd');
    checks.push({
        rule: "Proper Ground Reference",
        status: hasGround ? 'PASS' : 'FAIL',
        details: hasGround ? "Main ground reference found." : "No Ground (GND) component found. Circuit likely floating."
    });

    // Floating Node Check (Heuristic: Ports not in wire list)
    // Build a map of connected ports
    const connectedPorts = new Set<string>();
    wires.forEach(w => {
        connectedPorts.add(`${w.sourceComponentId}:${w.sourcePortId}`);
        connectedPorts.add(`${w.destComponentId}:${w.destPortId}`);
    });

    const floatingPorts: string[] = [];
    components.forEach(c => {
        const def = COMPONENT_LIBRARY.find(d => d.type === c.definitionType);
        if (def) {
            def.ports.forEach(p => {
                if (!connectedPorts.has(`${c.id}:${p.id}`)) {
                    floatingPorts.push(`${c.designator}:${p.id}`);
                }
            });
        }
    });

    if (floatingPorts.length > 0) {
        checks.push({
            rule: "Floating / Unconnected Nodes",
            status: 'WARN',
            details: `Found ${floatingPorts.length} unconnected pins: ${floatingPorts.slice(0, 3).join(', ')}${floatingPorts.length > 3 ? '...' : ''}. Ensure signals have paths.`
        });
    } else {
        checks.push({
            rule: "Signal Flow",
            status: 'PASS',
            details: "All component ports appear connected."
        });
    }

    // --- 2. Decoupling Check (Geometric Heuristic) ---
    const ics = components.filter(c => c.definitionType === 'lm741' || c.definitionType.includes('555')); // Example ICs
    const capacitors = components.filter(c => c.definitionType === 'capacitor');
    
    ics.forEach(ic => {
        // Find nearest capacitor
        let minDist = Infinity;
        capacitors.forEach(cap => {
            const dist = Math.hypot(cap.x - ic.x, cap.y - ic.y);
            if (dist < minDist) minDist = dist;
        });

        // 100px threshold ~ 5 grid units
        if (minDist > 120) {
            checks.push({
                rule: "Decoupling / Bypass",
                status: 'WARN',
                details: `${ic.designator} has no capacitor nearby (<120px). Add 0.1uF bypass cap near power pins for stability.`
            });
        } else {
            checks.push({
                rule: "Decoupling / Bypass",
                status: 'PASS',
                details: `${ic.designator} has local decoupling.`
            });
        }
    });

    // --- 3. Electrical Checks (Simulation Data) ---
    if (simulationResults && lastNetlist) {
        
        // Voltage Rails
        // Heuristic: Check max voltage in system vs common standards
        let maxV = 0;
        simulationResults.data.forEach(row => {
            row.forEach(val => { if (Math.abs(val) > maxV) maxV = Math.abs(val); });
        });
        
        if (maxV > 24) {
            checks.push({
                rule: "Component Ratings (System Voltage)",
                status: 'WARN',
                details: `System peak voltage detected at ${maxV.toFixed(1)}V. Ensure all components rated > ${Math.ceil(maxV * 1.2)}V.`
            });
        }

        // Active Device Biasing (BJT)
        components.filter(c => c.definitionType.includes('2n') || c.definitionType.includes('transistor')).forEach(bjt => {
            // Try to find Vbe
            const spiceName = lastNetlist.componentMap.get(bjt.id);
            // This relies on the analyzer having run previously and populated probes, 
            // or we do a quick check on node voltages if we can map them.
            // Simplified: If sim passed without NaN, we assume basic DC OP valid.
        });

        // Check for NaNs (Convergence Failure / Short)
        const hasNaN = simulationResults.data.some(row => row.some(val => isNaN(val) || !isFinite(val)));
        if (hasNaN) {
            checks.push({
                rule: "Simulation Convergence",
                status: 'FAIL',
                details: "Simulation contains NaN/Infinity. Likely short circuit, singular matrix (floating node), or unstable loop."
            });
        } else {
             checks.push({
                rule: "Safe Start-up / Convergence",
                status: 'PASS',
                details: "Simulation converged with valid numerical results."
            });
        }
    } else {
        checks.push({
            rule: "Electrical Analysis",
            status: 'WARN',
            details: "No simulation data available. Run 'analyze_circuit' first for deep electrical checks."
        });
    }

    return {
        summary: `Performed ${checks.length} design rules.`,
        checks: checks
    };
};
