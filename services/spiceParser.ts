
import { SimulationData } from '../types';

/**
 * Parses raw NGSPICE output text into structured data.
 * Handles the tabular format, including page breaks and scientific notation.
 * Also parses scalar measurements from the logs if provided.
 */
export const parseSpiceOutput = (rawOutput: string, logs: string = ''): SimulationData | null => {
  if (!rawOutput && !logs) return null;

  const lines = rawOutput ? rawOutput.split('\n') : [];
  const result: SimulationData = {
    title: 'Untitled Simulation',
    analysisType: 'Unknown',
    variables: [],
    data: [],
    measurements: {}
  };

  let isReadingData = false;
  let headersFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Extract Metadata
    if (line.startsWith('Circuit:')) {
      result.title = line.replace('Circuit:', '').trim();
      continue;
    }
    if (line.includes('Analysis') && !headersFound) {
      // E.g., "Transient Analysis  Tue Dec  9 ..."
      const match = line.match(/^\s*(.+ Analysis)/);
      if (match) {
        result.analysisType = match[1].trim();
      }
    }

    // 2. Identify Table Header
    // Format: Index   time            v(in)           v(out)
    if (line.startsWith('Index')) {
      // Split by multiple spaces or tabs
      const vars = line.split(/\s+/).filter(v => v.length > 0);
      
      // If we haven't found headers yet, set them. 
      if (!headersFound) {
        // Remove 'Index' from variables list as it's just a row counter
        result.variables = vars.slice(1); 
        headersFound = true;
        isReadingData = true;
      } else {
        // We found a NEW header. 
        // If the variables are different, it's a separate table.
        // For now, to avoid data corruption (oscillation), we stop reading if we hit a second table.
        // Pagination repeats exact same header usually, but if variables differ, stop.
        const newVars = vars.slice(1);
        const isSame = newVars.length === result.variables.length && newVars.every((v, k) => v === result.variables[k]);
        
        if (!isSame) {
            isReadingData = false; // Stop reading data
        }
      }
      continue;
    }

    // 3. Skip separator lines
    if (line.startsWith('-----')) {
      continue;
    }

    // 4. Parse Data Rows
    // Format: 0	0.000000e+00	0.000000e+00	0.000000e+00
    // Regex matches start with digit or dot (for floats like .5)
    if (isReadingData) {
      if (/^[\d.]/.test(line)) {
        const parts = line.split(/\s+/).filter(p => p.length > 0);
        
        // We expect parts.length to be variables.length + 1 (for Index)
        // If exact match or more (ignore trailing garbage)
        if (parts.length >= result.variables.length + 1) {
          const values = parts.slice(1).map(val => parseFloat(val));
          
          // Verify we got valid numbers
          if (values.every(v => !isNaN(v))) {
             result.data.push(values);
          }
        }
      } else {
        // Line doesn't start with number, probably footer info or page break text
        // Only stop reading if we have collected some data and hit a non-data line (like "Total ...")
        if (result.data.length > 0 && line.toLowerCase().includes('total')) {
            isReadingData = false;
        }
      }
    }
  }

  // 5. Parse Scalar Measurements from Logs (stdout)
  if (logs) {
      result.measurements = parseMeasResults(logs);
  }

  // Sanity check
  if (result.variables.length === 0 || result.data.length === 0) {
    // If we have measurement results but no plot data (e.g., .OP simulation sometimes), that's fine.
    if (Object.keys(result.measurements || {}).length > 0) {
        return result;
    }
    return null;
  }

  return result;
};

/**
 * Extracts .meas scalar results from NGSPICE logs.
 * Example Log Lines:
 *   v_vcc             =  5.000000e+00
 *   i_total           =  -5.00000e-03
 *   vcap_max          =  4.999000e+00
 */
const parseMeasResults = (logs: string): Record<string, number> => {
    const measurements: Record<string, number> = {};
    const lines = logs.split('\n');
    
    // Regex for: "name = value" where value is scientific notation or simple number
    // Looks for:  name = value
    const regex = /^\s*([a-zA-Z0-9_]+)\s*=\s*([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*$/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            const name = match[1];
            const val = parseFloat(match[2]);
            if (!isNaN(val)) {
                measurements[name] = val;
            }
        }
    });

    return measurements;
};
