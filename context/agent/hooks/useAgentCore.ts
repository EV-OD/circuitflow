
import React, { useRef, useEffect } from 'react';
import { ChatMessage, AgentMode } from '../../../types';
import { useCircuit } from '../../CircuitContext';
import { buildSystemContext, getSystemInstruction } from '../prompts';
import { prepareHistoryForModel } from '../core/history';
import { runAgentLoop } from '../core/agentLoop';

interface AgentCoreProps {
    messages: ChatMessage[];
    agentMode: AgentMode;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
    executeTools: (toolCalls: any[]) => Promise<any>;
    updateUsageMetrics: (input: number, output: number) => void;
}

export const useAgentCore = ({ messages, agentMode, setMessages, setIsThinking, executeTools, updateUsageMetrics }: AgentCoreProps) => {
    const { components, wires } = useCircuit();

    // Use refs to access latest state during async loops
    const componentsRef = useRef(components);
    const wiresRef = useRef(wires);

    useEffect(() => {
        componentsRef.current = components;
        wiresRef.current = wires;
    }, [components, wires]);

    const sendMessage = async (text: string) => {
        const userMsgId = crypto.randomUUID();
        
        // 1. Optimistic UI Update
        setMessages(prev => [...prev, {
            id: userMsgId,
            role: 'user',
            content: text,
            timestamp: Date.now()
        }]);
        
        setIsThinking(true);
        console.log(`%c[User Message] 🗣️`, 'color: #8b5cf6; font-weight: bold;', text);

        try {
            // 2. Prepare History
            const historyForModel = prepareHistoryForModel(messages);

            // 3. Build Current System Context
            let circuitContext = buildSystemContext(componentsRef.current, wiresRef.current);
            console.log(`%c[System Context] 🧠`, 'color: #64748b;', "Context size: " + circuitContext.length + " chars");

            // 4. Construct Prompt
            // Merge System Context into the USER prompt to ensure valid User->Model alternation
            const combinedPrompt = `${circuitContext}\n\nUser Query: ${text}`;

            const initialTurn = [
                ...historyForModel,
                { role: 'user', parts: [{ text: combinedPrompt }] }
            ];

            // 5. Select System Instruction based on Mode
            const systemInstruction = getSystemInstruction(agentMode);

            // 6. Start Execution Loop
            await runAgentLoop({
                initialTurn,
                systemInstruction,
                executeTools,
                setMessages,
                onUsageUpdate: updateUsageMetrics
            });

        } catch (error: any) {
            console.error("Agent Error Details:", error);
            
            let userFriendlyError = "Something went wrong.";
            if (error.message?.includes("400")) userFriendlyError = "I got confused (Bad Request). Let's start a fresh topic.";
            else if (error.message?.includes("API Key")) userFriendlyError = "Configuration Error: API Key missing or invalid.";
            else if (error.message) userFriendlyError = error.message;

            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'model',
                content: `**Error:** ${userFriendlyError}`,
                isError: true,
                timestamp: Date.now()
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    return { sendMessage };
};
