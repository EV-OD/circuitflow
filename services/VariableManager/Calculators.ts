
/**
 * Creates an array of zeros of the specified length.
 */
export const createZeroArray = (length: number): number[] => {
    return new Array(length).fill(0);
};

/**
 * Subtracts array B from array A element-wise.
 * Result[i] = A[i] - B[i]
 */
export const calculateDifference = (a: number[], b: number[]): number[] => {
    if (a.length !== b.length) {
        console.warn("Array length mismatch in calculation", a.length, b.length);
        const minLen = Math.min(a.length, b.length);
        const result = new Array(minLen);
        for(let i=0; i<minLen; i++) result[i] = a[i] - b[i];
        return result;
    }
    return a.map((val, i) => val - b[i]);
};

/**
 * Negates all values in an array.
 * Result[i] = -A[i]
 */
export const negateArray = (a: number[]): number[] => {
    return a.map(val => -val);
};
