
/**
 * Calculates the fundamental frequency of a signal trace.
 * Returns the frequency in Hz, 0 for DC, or null if aperiodic/undetermined.
 */
export function calculateFrequency(data: { x: number, y: number }[]): number | null {
    if (data.length < 2) return null;

    // 1. Check for DC (constant signal)
    const yValues = data.map(p => p.y);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // If the signal amplitude is extremely small, consider it DC (0 Hz)
    if (Math.abs(yMax - yMin) < 1e-9) return 0;

    // 2. Remove DC offset (center the signal)
    const sum = yValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;
    const centered = data.map(p => ({ ...p, y: p.y - mean }));

    // 3. Find zero crossings (rising edges)
    // We look for transitions from negative to positive
    const crossings: number[] = [];
    for (let i = 1; i < centered.length; i++) {
        const prev = centered[i - 1];
        const curr = centered[i];

        if (prev.y < 0 && curr.y >= 0) {
            // Linear interpolation to find precise crossing time
            // y = mx + c
            // We want x where y=0
            // Slope m = (y2 - y1) / (x2 - x1)
            // y - y1 = m(x - x1)
            // 0 - y1 = m(x - x1) => -y1/m = x - x1 => x = x1 - y1/m
            
            const dy = curr.y - prev.y;
            if (dy !== 0) {
                const dx = curr.x - prev.x;
                const m = dy / dx;
                const t = prev.x - (prev.y / m);
                crossings.push(t);
            }
        }
    }

    // 4. Analyze crossings
    if (crossings.length < 2) {
        // Not enough cycles to determine frequency
        return null;
    }

    // Calculate intervals between consecutive rising edges (periods)
    const intervals: number[] = [];
    for (let i = 1; i < crossings.length; i++) {
        intervals.push(crossings[i] - crossings[i - 1]);
    }

    // 5. Check for periodicity consistency
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Calculate standard deviation of intervals
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV)
    const cv = stdDev / meanInterval;

    // If CV is low (e.g., < 0.1 or 10%), we consider it periodic
    // We can be a bit lenient as simulation steps might introduce slight jitter
    if (cv < 0.15) {
        return 1 / meanInterval;
    }

    // If it's not consistent, it might be aperiodic or complex
    return null;
}

/**
 * Formats a frequency value into a readable string (Hz, kHz, MHz, etc.)
 */
export function formatFrequency(hz: number | null): string {
    if (hz === null) return 'Aperiodic';
    if (hz === 0) return 'DC';

    const absHz = Math.abs(hz);
    if (absHz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
    if (absHz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
    if (absHz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
    return `${hz.toFixed(2)} Hz`;
}
