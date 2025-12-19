
/**
 * Normalizes variable names to a consistent internal format (lowercase, no spaces).
 * e.g., "V( 4, 1 )" -> "v(4,1)"
 */
export const normalizeVar = (v: string): string => {
    if (!v) return '';
    // Remove ALL whitespace and lowercase
    return v.toLowerCase().replace(/\s+/g, '');
};

/**
 * Parses a differential voltage string like "v(node1,node2)" into parts.
 * Returns null if it's not a differential request.
 */
export const parseDifferential = (v: string): { n1: string, n2: string } | null => {
    const norm = normalizeVar(v);
    const match = norm.match(/^v\((.+),(.+)\)$/);
    if (!match) return null;
    return { n1: match[1], n2: match[2] };
};

/**
 * Checks if a variable is requesting ground (v(0)).
 */
export const isGround = (v: string): boolean => {
    const norm = normalizeVar(v);
    return norm === 'v(0)' || norm === '0';
};
