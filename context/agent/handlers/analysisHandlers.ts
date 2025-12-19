
import { CircuitComponent, ComponentDefinition, Wire, CircuitReport } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { startSimulation } from '../../../simulation/control';
import { generateComponentReport } from '../../../simulation/analyzers/ComponentReporter';

interface AnalysisRefs {
    components: CircuitComponent[];
    wires: Wire[];
    customDefinitions: ComponentDefinition[];
}

interface AnalysisActions {
    addReport: (report: CircuitReport) => void;
}

export const handleRunElectricalAnalysis = async (
    args: any,
    refs: AnalysisRefs,
    actions: AnalysisActions
) => {
    try {
        const allDefinitions = [...COMPONENT_LIBRARY, ...refs.customDefinitions];
        
        // 1. Configure Simulation (Standard Transient if not specified)
        const config = {
            type: 'TRAN' as const,
            transient: {
                stopTime: args.simulationConfig?.stopTime || '5ms',
                stepTime: args.simulationConfig?.stepTime || '5us',
                startTime: '0'
            },
            dc: { source: 'V1', start: '0', stop: '5', increment: '0.1' } // unused for TRAN
        };

        // 2. Run Simulation
        const result = await startSimulation(config, {
            components: refs.components,
            wires: refs.wires,
            definitions: refs.customDefinitions
        });

        // 3. Analyze Components
        const componentAnalysis = refs.components.map(comp => {
            const def = allDefinitions.find(d => d.type === comp.definitionType);
            if (!def) return null;

            const report = generateComponentReport(result, comp.id, def, refs.customDefinitions);
            
            // Check for failures
            const issues = report.metrics.filter(m => m.status === 'warning' || m.status === 'danger');
            
            return {
                designator: comp.designator,
                type: comp.definitionType,
                status: issues.length > 0 ? (issues.some(i => i.status === 'danger') ? 'FAIL' : 'WARN') : 'PASS',
                stress_metrics: report.metrics.map(m => `${m.label}: ${m.value}${m.unit} (${m.status})`)
            };
        }).filter(Boolean);

        // 4. Summarize
        const failures = componentAnalysis.filter(c => c?.status === 'FAIL');
        const warnings = componentAnalysis.filter(c => c?.status === 'WARN');

        return {
            status: "Electrical Analysis Complete",
            summary: {
                total_components: componentAnalysis.length,
                failures: failures.length,
                warnings: warnings.length
            },
            failures: failures.map(f => ({ component: f?.designator, issues: f?.stress_metrics })),
            warnings: warnings.map(w => ({ component: w?.designator, issues: w?.stress_metrics })),
            simulation_metadata: {
                time_points: result.data.data.length,
                duration: config.transient.stopTime
            }
        };

    } catch (e: any) {
        console.error("Electrical Analysis Failed:", e);
        return { error: `Simulation failed: ${e.message}. Ensure ground (node 0) exists.` };
    }
};
