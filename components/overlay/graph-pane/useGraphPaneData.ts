
import { useMemo } from 'react';
import { SimulationData, GraphPane } from '../../../types';
import { normalizeVar, parseDifferential } from '../../../services/VariableManager/Normalizers';
import { useGraphData } from '../../../hooks/useGraphData';

export const useGraphPaneData = (
    simulationResults: SimulationData | null,
    pane: GraphPane,
    xAxisVar: string
) => {
    const displayData = useMemo(() => {
        if (!simulationResults || !pane) return null;
        if (pane.variables.length === 0) return null;

        // Find X axis index (if present)
        const xIndex = simulationResults.variables.findIndex(
            (v) => normalizeVar(v) === normalizeVar(xAxisVar),
        );

        type ColSpec =
            | { kind: "col"; idx: number } // direct copy of column idx
            | { kind: "diff"; a: number; b: number }; // synthetic: row[a] - row[b]; b or a can be -1 for ground

        const resultVariables: string[] = [];
        const resultCols: ColSpec[] = [];

        // If X axis exists in results, include it first (keeps original label)
        if (xIndex !== -1) {
            resultVariables.push(simulationResults.variables[xIndex]);
            resultCols.push({ kind: "col", idx: xIndex });
        }

        // Helper: push an existing column only if it's not already present in resultCols
        const ensureAddIndex = (idx: number) => {
            const already = resultCols.some(
                (c) => c.kind === "col" && (c as any).idx === idx,
            );
            if (!already) {
                resultVariables.push(simulationResults.variables[idx]);
                resultCols.push({ kind: "col", idx });
            }
        };

        // Iterate requested variables in pane order to preserve UI ordering
        pane.variables.forEach((requestedVar) => {
            const normRequested = normalizeVar(requestedVar);

            // Exact match in simulation results?
            const exactIdx = simulationResults.variables.findIndex(
                (sv) => normalizeVar(sv) === normRequested,
            );
            if (exactIdx !== -1) {
                ensureAddIndex(exactIdx);
                return;
            }

            // Try to parse as differential: v(n1,n2)
            const diff = parseDifferential(requestedVar);
            if (diff) {
                // Build normalized single-node labels to search for "v(n)" variants
                const target1 = `v(${diff.n1})`;
                const target2 = `v(${diff.n2})`;
                const idx1 = simulationResults.variables.findIndex(
                    (sv) => normalizeVar(sv) === normalizeVar(target1),
                );
                const idx2 = simulationResults.variables.findIndex(
                    (sv) => normalizeVar(sv) === normalizeVar(target2),
                );

                if (idx1 !== -1 && idx2 !== -1) {
                    // both nodes present -> synthetic column (v(n1) - v(n2))
                    resultVariables.push(requestedVar);
                    resultCols.push({ kind: "diff", a: idx1, b: idx2 });
                } else if (idx1 !== -1 && idx2 === -1) {
                    // second missing - if requested as ground (0) treat as ground, else warn
                    if (diff.n2 === "0") {
                        resultVariables.push(requestedVar);
                        resultCols.push({ kind: "diff", a: idx1, b: -1 });
                    } else {
                        console.warn(
                            `[GraphPane] Differential variable '${requestedVar}' requested but node '${diff.n2}' not found.`,
                        );
                    }
                } else if (idx1 === -1 && idx2 !== -1) {
                    // first missing - if first is ground treat as ground (0 - v(n2))
                    if (diff.n1 === "0") {
                        resultVariables.push(requestedVar);
                        resultCols.push({ kind: "diff", a: -1, b: idx2 });
                    } else {
                        console.warn(
                            `[GraphPane] Differential variable '${requestedVar}' requested but node '${diff.n1}' not found.`,
                        );
                    }
                } else {
                    console.warn(
                        `[GraphPane] Differential variable '${requestedVar}' requested but neither node found.`,
                    );
                }
                return;
            }

            // If we reach here variable not found at all
            console.warn(
                `[GraphPane] Requested variable '${requestedVar}' not found in simulation results.`,
            );
        });

        if (resultVariables.length === 0) return null;

        // Build new data rows: for each row in original data, construct a row matching resultCols
        const newData: number[][] = simulationResults.data.map((row) => {
            const newRow: number[] = [];
            for (const col of resultCols) {
                if (col.kind === "col") {
                    const idx = col.idx;
                    newRow.push(idx >= 0 ? row[idx] : NaN);
                } else if (col.kind === "diff") {
                    const a = col.a;
                    const b = col.b;
                    const valA = a >= 0 ? row[a] : 0;
                    const valB = b >= 0 ? row[b] : 0;
                    newRow.push(valA - valB);
                } else {
                    newRow.push(NaN);
                }
            }
            return newRow;
        });

        return { ...simulationResults, variables: resultVariables, data: newData };
    }, [simulationResults, pane, xAxisVar]);

    const processedGraphData = useGraphData(displayData, xAxisVar);

    return { displayData, processedGraphData };
};
