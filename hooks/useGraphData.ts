
import { useMemo } from 'react';
import { SimulationData } from '../types';

export const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#ec4899', '#6366f1'];

export interface GraphSeries {
    label: string;
    values: { x: number, y: number }[];
    color: string;
}

export interface ProcessedGraphData {
    xValues: number[];
    xLabel: string;
    series: GraphSeries[];
    xIndex: number;
    yMin: number;
    yMax: number;
}

export const useGraphData = (data: SimulationData | null, xAxisVariable?: string) => {
    return useMemo((): ProcessedGraphData | null => {
        if (!data || data.data.length === 0 || data.variables.length === 0) return null;

        const normalize = (s: string) => s.toLowerCase();

        // Determine X Axis Index
        let xIndex = 0;
        let xLabel = data.variables[0];

        if (xAxisVariable) {
            const idx = data.variables.findIndex(v => normalize(v) === normalize(xAxisVariable));
            if (idx !== -1) {
                xIndex = idx;
                xLabel = data.variables[idx];
            }
        }

        // 1. Filter out invalid rows (NaNs in X axis or mismatch length)
        const validRows = data.data.filter(row => 
            row.length === data.variables.length && 
            !isNaN(row[xIndex])
        );

        // 2. Sort data rows by the X-axis value to prevent "zig-zag" lines
        const sortedDataRows = [...validRows].sort((a, b) => a[xIndex] - b[xIndex]);

        const xValues = sortedDataRows.map(row => row[xIndex]);
        
        const series = data.variables
            .map((label, i) => {
                if (i === xIndex) return null; // Don't plot X vs X
                return { 
                    label, 
                    values: sortedDataRows.map(row => ({ x: row[xIndex], y: row[i] })), 
                    color: COLORS[i % COLORS.length] 
                };
            })
            .filter((s): s is GraphSeries => s !== null);

        if (series.length === 0) return null;

        // Calculate Global Min/Max for Y Scaling
        const yMin = Math.min(...series.map(s => Math.min(...s.values.map(v => v.y))));
        const yMax = Math.max(...series.map(s => Math.max(...s.values.map(v => v.y))));

        return { xValues, xLabel, series, xIndex, yMin, yMax };
    }, [data, xAxisVariable]);
};
