
import { GoogleGenAI } from '@google/genai';
import { tools } from '../../tools';

const MODELS_FALLBACK_CHAIN = [
    'gemini-2.5-flash',
    'gemini-3-pro-preview',
    'gemini-2.0-flash-lite-preview-02-05'
];

// Track the current active model index for the session.
// If a model fails due to rate limits, we advance this index so subsequent calls
// start immediately with the fallback model, avoiding wasted calls to the limited model.
let activeModelIndex = 0;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRateLimitError = (error: any): boolean => {
    if (!error) return false;
    
    // Check standard status codes
    if (error.status === 429 || error.code === 429) return true;
    
    // Check nested error object (typical Google API error format)
    if (error.error?.code === 429 || error.error?.status === 'RESOURCE_EXHAUSTED') return true;

    // Check message content
    const msg = (typeof error === 'string' ? error : (error.message || JSON.stringify(error))).toLowerCase();
    return msg.includes('quota') || 
           msg.includes('resource_exhausted') || 
           msg.includes('429');
};

const extractRetryDelay = (error: any): number => {
    const defaultDelay = 5000;
    try {
        const str = JSON.stringify(error);
        
        // Search for "retryDelay": "20.508599036s" inside details object in JSON
        const matchJSON = str.match(/"retryDelay":\s*"([\d\.]+)s"/);
        if (matchJSON && matchJSON[1]) return Math.ceil(parseFloat(matchJSON[1]) * 1000) + 1000; // Add 1s buffer

        // Search for message "Please retry in 20.508599036s."
        const msg = error.message || str;
        const matchMsg = msg.match(/retry in ([\d\.]+)s/);
        if (matchMsg && matchMsg[1]) return Math.ceil(parseFloat(matchMsg[1]) * 1000) + 1000;

    } catch (e) {
        // ignore parsing errors
    }
    return defaultDelay;
};

export const generateAgentResponse = async (
    history: any[],
    systemInstruction: string,
    toolConfig: any = { tools: [{ functionDeclarations: tools }] }
) => {
    // Initialize inside function to ensure environment variables are loaded
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.error("CRITICAL: API_KEY is missing from process.env");
        throw new Error("Configuration Error: API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    let lastError: any = null;

    // Start from the last known good model (activeModelIndex)
    for (let i = activeModelIndex; i < MODELS_FALLBACK_CHAIN.length; i++) {
        const model = MODELS_FALLBACK_CHAIN[i];
        let retries = 0;
        const MAX_RETRIES_PER_MODEL = 1; // Try to wait once per model before switching

        while (retries <= MAX_RETRIES_PER_MODEL) {
            try {
                if (retries === 0) {
                    console.log(`Sending request to Gemini [${model}]...`, { historyLength: history.length });
                } else {
                    console.log(`Retrying request on [${model}] (Attempt ${retries + 1})...`);
                }

                const response = await ai.models.generateContent({
                    model,
                    contents: history,
                    config: {
                        ...toolConfig,
                        systemInstruction
                    }
                });
                
                // If we successfully used a model further down the chain, persist that choice for the session
                if (i > activeModelIndex) {
                    console.log(`Rate limit avoidance: Switching session preference to ${model}`);
                    activeModelIndex = i;
                }

                return response;

            } catch (error: any) {
                lastError = error;

                if (isRateLimitError(error)) {
                    const waitTime = extractRetryDelay(error);
                    console.warn(`Rate limit (429) hit on ${model}. Waiting ${waitTime}ms...`);
                    
                    if (retries < MAX_RETRIES_PER_MODEL) {
                        await delay(waitTime);
                        retries++;
                        continue; // Retry logic
                    } else {
                        console.warn(`Max retries reached for ${model}. Switching to next model...`);
                        break; // Break inner loop, continue outer loop (next model)
                    }
                }

                // If it's NOT a rate limit error (e.g. 400 Bad Request, Safety Filter), 
                // fail immediately as retrying won't fix it.
                console.warn(`Gemini API Call Failed on ${model} (Non-recoverable):`, error.message);
                throw error;
            }
        }
    }

    // If all primary attempts failed, try one final Hail Mary with the Lite model without retries
    // This handles edge cases where the active index was messed up or we exhausted the chain
    console.warn("All fallback models exhausted. Attempting Hail Mary (Lite)...");
    try {
        const hailMaryModel = 'gemini-2.0-flash-lite-preview-02-05';
        const response = await ai.models.generateContent({
            model: hailMaryModel,
            contents: history,
            config: {
                ...toolConfig,
                systemInstruction
            }
        });
        
        return response;
    } catch (finalError) {
        console.error("Hail Mary failed.");
        throw lastError || new Error("Failed to generate response from any model. Please check quota.");
    }
};
