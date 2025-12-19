
/**
 * Calculates the maximum value in a data series.
 */
export const calculateMax = (series: number[]): number => {
    if (!series.length) return 0;
    return Math.max(...series);
};

/**
 * Calculates the minimum value in a data series.
 */
export const calculateMin = (series: number[]): number => {
    if (!series.length) return 0;
    return Math.min(...series);
};

/**
 * Calculates the average (arithmetic mean) of a series.
 */
export const calculateAverage = (series: number[]): number => {
    if (!series.length) return 0;
    const sum = series.reduce((a, b) => a + b, 0);
    return sum / series.length;
};

/**
 * Calculates the Root Mean Square (RMS) of a series.
 * Useful for AC power analysis.
 */
export const calculateRMS = (series: number[]): number => {
    if (!series.length) return 0;
    const sumSquares = series.reduce((a, b) => a + (b * b), 0);
    return Math.sqrt(sumSquares / series.length);
};

/**
 * Calculates the absolute peak-to-peak amplitude.
 */
export const calculatePeakToPeak = (series: number[]): number => {
    if (!series.length) return 0;
    return Math.max(...series) - Math.min(...series);
};

/**
 * Integrates a series over time using the Trapezoidal Rule.
 * Useful for calculating Energy (Joules) from Power (Watts).
 * @param time - The time array (x-axis)
 * @param series - The data array (y-axis, e.g., Power)
 */
export const integrate = (time: number[], series: number[]): number => {
    if (time.length !== series.length || time.length < 2) return 0;
    
    let area = 0;
    for (let i = 1; i < time.length; i++) {
        const dt = time[i] - time[i - 1];
        const avgVal = (series[i] + series[i - 1]) / 2;
        area += avgVal * dt;
    }
    return area;
};

/**
 * Multiplies two series element-wise.
 * Useful for calculating Instantaneous Power (P = V * I).
 */
export const multiplySeries = (seriesA: number[], seriesB: number[]): number[] => {
    const len = Math.min(seriesA.length, seriesB.length);
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
        result[i] = seriesA[i] * seriesB[i];
    }
    return result;
};
