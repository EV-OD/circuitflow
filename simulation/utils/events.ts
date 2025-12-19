
/**
 * Represents a specific point in time where a signal condition occurred.
 */
export interface SignalEvent {
    index: number;
    time: number;
    value: number;
    type: 'rising' | 'falling';
}

/**
 * Finds all time indices where the signal crosses a threshold.
 * Uses linear interpolation to estimate exact time between steps.
 */
export const findCrossings = (
    time: number[], 
    signal: number[], 
    threshold: number
): SignalEvent[] => {
    const events: SignalEvent[] = [];
    
    for (let i = 1; i < signal.length; i++) {
        const prev = signal[i - 1];
        const curr = signal[i];
        
        // Rising Edge: Prev < Threshold <= Curr
        if (prev < threshold && curr >= threshold) {
            // Linear interpolation for more precise time
            const fraction = (threshold - prev) / (curr - prev);
            const exactTime = time[i - 1] + fraction * (time[i] - time[i - 1]);
            
            events.push({
                index: i,
                time: exactTime,
                value: threshold,
                type: 'rising'
            });
        }
        
        // Falling Edge: Prev > Threshold >= Curr
        if (prev > threshold && curr <= threshold) {
            const fraction = (prev - threshold) / (prev - curr);
            const exactTime = time[i - 1] + fraction * (time[i] - time[i - 1]);
            
            events.push({
                index: i,
                time: exactTime,
                value: threshold,
                type: 'falling'
            });
        }
    }
    
    return events;
};

/**
 * Calculates the rise time (10% to 90%) of the *first* rising edge found.
 */
export const calculateRiseTime = (time: number[], signal: number[], steadyStateHigh: number): number | null => {
    const lowThresh = steadyStateHigh * 0.1;
    const highThresh = steadyStateHigh * 0.9;
    
    const risingEdgesLow = findCrossings(time, signal, lowThresh);
    const risingEdgesHigh = findCrossings(time, signal, highThresh);
    
    // Find the first valid pair where Low happens before High
    if (risingEdgesLow.length > 0 && risingEdgesHigh.length > 0) {
        const t1 = risingEdgesLow[0].time;
        // Find first high threshold crossing AFTER the low crossing
        const t2Event = risingEdgesHigh.find(e => e.time > t1);
        
        if (t2Event) {
            return t2Event.time - t1;
        }
    }
    
    return null;
};

/**
 * Calculates the delay between two signals (e.g., Input vs Output).
 * Measures time difference between the first crossing of 50% threshold on both.
 */
export const calculatePropagationDelay = (
    time: number[],
    inputSignal: number[],
    outputSignal: number[],
    threshold: number
): number | null => {
    const inputEvents = findCrossings(time, inputSignal, threshold);
    const outputEvents = findCrossings(time, outputSignal, threshold);
    
    if (inputEvents.length > 0 && outputEvents.length > 0) {
        // Find the first output event that happens AFTER the first input event
        const tInput = inputEvents[0].time;
        const matchingOutput = outputEvents.find(e => e.time >= tInput && e.type === inputEvents[0].type);
        
        if (matchingOutput) {
            return matchingOutput.time - tInput;
        }
    }
    
    return null;
};
