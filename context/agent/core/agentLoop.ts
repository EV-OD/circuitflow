
import React from 'react';
import { generateAgentResponse } from '../../../services/agent/geminiService';
import { ToolCallSummary } from '../../../types';

interface LoopParams {
    initialTurn: any[];
    systemInstruction: string;
    executeTools: (tools: any[]) => Promise<any>;
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
    onUsageUpdate?: (input: number, output: number) => void;
}

export const runAgentLoop = async ({ initialTurn, systemInstruction, executeTools, setMessages, onUsageUpdate }: LoopParams) => {
    let currentTurn = [...initialTurn];
    
    let iterations = 0;
    const MAX_ITERATIONS = 5; 
    
    console.log("Calling Gemini API...");
    let currentModelResponse: any = await generateAgentResponse(currentTurn, systemInstruction);

    while (iterations < MAX_ITERATIONS) {
        const candidates = currentModelResponse.candidates;
        const usage = currentModelResponse.usageMetadata;

        // Update Usage Metrics
        if (usage && onUsageUpdate) {
            onUsageUpdate(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
        }
                 
        if (!candidates || candidates.length === 0) {
            console.warn("Gemini returned no candidates. Likely safety filter or empty response.");
            if (iterations === 0) {
                throw new Error("The AI response was blocked or empty. Please try rephrasing.");
            }
            break;
        }

        const content = candidates[0].content;
        const parts = content.parts || [];
        
        // 1. Extract Information
        const textPart = parts.find((p: any) => p.text);
        const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
        const grounding = candidates[0].groundingMetadata;

        // 2. Display Text Response
        if (textPart && textPart.text) {
            console.log(`%c[AI Response] 🤖`, 'color: #10b981; font-weight: bold;', textPart.text);
            setMessages((prev: any) => [...prev, {
                id: crypto.randomUUID(),
                role: 'model',
                content: textPart.text,
                timestamp: Date.now()
            }]);
        }

        // 3. Display Grounding (Sources)
        if (grounding?.groundingChunks) {
            const links = grounding.groundingChunks
                .map((c: any) => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null)
                .filter(Boolean)
                .join('\n');
            if (links) {
                setMessages((prev: any) => [...prev, {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: `Sources:\n${links}`,
                    timestamp: Date.now()
                }]);
            }
        }

        // 4. Handle Tool Executions
        if (functionCalls.length > 0) {
            console.log(`%c[Tool Call] 🛠️`, 'color: #f59e0b; font-weight: bold;', functionCalls);

            // A. Show UI
            const toolMsgId = crypto.randomUUID();
            const uiToolCalls: ToolCallSummary[] = functionCalls.map((fc: any) => ({
                name: fc.name,
                args: fc.args,
                status: 'running'
            }));

            setMessages((prev: any) => [...prev, {
                id: toolMsgId,
                role: 'model',
                content: '',
                toolCalls: uiToolCalls,
                timestamp: Date.now()
            }]);

            // B. Execute Logic
            const toolResponses = await executeTools(functionCalls);
            
            // C. Update UI to Complete and attach Results
            setMessages((prev: any) => prev.map((m: any) => m.id === toolMsgId ? {
                ...m,
                toolCalls: m.toolCalls?.map((tc: any, idx: number) => ({ 
                    ...tc, 
                    status: 'complete',
                    result: toolResponses[idx]?.functionResponse?.response?.result 
                }))
            } : m));

            // Check for Image Data in responses to inject into the NEXT turn
            let injectedImagePart: any = null;
            
            // Sanitize responses (remove base64 from text history to save tokens) and check for image
            const cleanResponses = toolResponses.map((r: any) => {
                if (r.functionResponse?.response?.result?._imageData) {
                    console.log("Injecting captured image into context...");
                    injectedImagePart = {
                        inlineData: {
                            mimeType: 'image/png',
                            data: r.functionResponse.response.result._imageData
                        }
                    };
                    // Replace huge base64 with a placeholder text for the history
                    return {
                        functionResponse: {
                            name: r.functionResponse.name,
                            response: { result: { message: "Image captured and sent to model." } }
                        }
                    };
                }
                return r;
            });

            // D. Update Chain History
            currentTurn.push(content);
            currentTurn.push({ role: 'function', parts: cleanResponses });

            // If we have an image, we append it as a User message (or System context) for the model to see
            if (injectedImagePart) {
                currentTurn.push({
                    role: 'user',
                    parts: [injectedImagePart, { text: "I have captured the circuit image. Please analyze it." }]
                });
            }

            // E. Re-Prompt Model
            console.log(`%c[Re-Prompting AI] 🔄`, 'color: #6366f1;', "Sending tool results back...");
            currentModelResponse = await generateAgentResponse(currentTurn, systemInstruction);
            
            iterations++;
        } else {
            break;
        }
    }
};
