
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, StopCircle, User, Sparkles } from 'lucide-react';
import { CircuitComponent, ComponentDefinition } from '../../../../types';
import { ComponentReport } from '../../../analyzers/ComponentReporter';
import { GoogleGenAI } from '@google/genai';
import { componentChatTools } from '../tools';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';

interface ComponentChatProps {
    component: CircuitComponent;
    definition: ComponentDefinition;
    report: ComponentReport;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// Fallback chain for reliability
const MODEL_CHAIN = [
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-2.5-flash'
];

export const ComponentChat: React.FC<ComponentChatProps> = ({ component, definition, report }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const designator = component.designator || 'Component';

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ 
                role: 'model', 
                text: `Hi! I'm your assistant for **${designator}** (${definition.label}). Ask me about its power usage, voltage levels, or specs.` 
            }]);
        }
    }, [designator, definition.label]);

    const md = useMemo(() => {
        const parser = new MarkdownIt({ html: false, linkify: true, typographer: true });
        parser.use(mk);
        return parser;
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const generateWithFallback = async (ai: GoogleGenAI, requestParams: any) => {
        let lastError = null;
        for (const model of MODEL_CHAIN) {
            try {
                // console.log(`Attempting generation with ${model}...`);
                return await ai.models.generateContent({
                    model,
                    ...requestParams
                });
            } catch (e: any) {
                lastError = e;
                const isRateLimit = e.status === 429 || 
                                    (e.message && e.message.toLowerCase().includes('resource exhausted')) ||
                                    (e.error && e.error.code === 429);
                
                if (isRateLimit) {
                    console.warn(`[ComponentChat] Rate limit on ${model}. Switching fallback...`);
                    continue;
                }
                throw e; // Re-throw other errors (e.g. Safety, Invalid Arg)
            }
        }
        throw lastError;
    };

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;
        
        const userMsg = input;
        setInput('');
        setIsThinking(true);
        
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });
            
            // Build Context
            const systemPrompt = `
                You are a dedicated electronics analysis assistant for a specific component on a circuit board.
                
                TARGET COMPONENT:
                - Name: ${definition.label}
                - Designator: ${designator}
                - Type: ${definition.type}
                - Properties: ${JSON.stringify(component.properties)}
                
                SIMULATION DATA (Live):
                ${JSON.stringify(report.metrics, null, 2)}
                
                RULES:
                1. Answer questions strictly about this component.
                2. Be concise and technical.
                3. Use Markdown for formatting.
                4. If values are 0, explain why (e.g. open circuit, no load).
                
                TOOLS:
                - Use 'googleSearch' function to find datasheet info if asked about physical limits not shown in simulation.
                - Use 'get_component_data' to refresh metrics.
            `;

            // Prepare History
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            history.push({ role: 'user', parts: [{ text: userMsg }] });

            // Generate with Fallback
            const response = await generateWithFallback(ai, {
                contents: history,
                config: {
                    systemInstruction: systemPrompt,
                    tools: [{ functionDeclarations: componentChatTools }]
                }
            });

            // Handle Response & Tools
            const candidates = response.candidates;
            if (candidates && candidates.length > 0) {
                const content = candidates[0].content;
                const textPart = content.parts?.find(p => p.text);
                const funcCall = content.parts?.find(p => p.functionCall)?.functionCall;

                if (textPart?.text) {
                    setMessages(prev => [...prev, { role: 'model', text: textPart.text }]);
                } 
                else if (funcCall) {
                    let toolResult = "Executed.";
                    if (funcCall.name === 'get_component_data') {
                        toolResult = JSON.stringify(report);
                    } else if (funcCall.name === 'googleSearch') {
                        const query = (funcCall.args as any).query;
                        toolResult = `[Mock Search Results for "${query}"]:
                        - ${definition.label} Datasheet: Vmax = ${definition.datasheet?.v_max || '30V'}, Imax = ${definition.datasheet?.i_max || '1A'}, Pmax = ${definition.datasheet?.p_max || '0.5W'}.
                        - Typical Application: Signal switching, amplification.
                        - Package: SOT-23, TO-92.`;
                    }

                    // Feed back tool result
                    const followUpReq = {
                        contents: [
                            ...history,
                            { role: 'model', parts: content.parts },
                            { role: 'function', parts: [{ functionResponse: { name: funcCall.name, response: { result: toolResult } } }] }
                        ],
                        config: { 
                            systemInstruction: systemPrompt,
                            tools: [{ functionDeclarations: componentChatTools }]
                        }
                    };

                    const followUp = await generateWithFallback(ai, followUpReq);
                    
                    const followUpText = followUp.candidates?.[0].content.parts?.find(p => p.text)?.text;
                    if (followUpText) {
                        setMessages(prev => [...prev, { role: 'model', text: followUpText }]);
                    }
                }
            }

        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'model', text: `**Error**: ${e.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 block">
                            {designator} Assistant
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Sparkles className="w-2 h-2" /> Auto-Model
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'model' && (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        )}
                        <div 
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                m.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none text-gray-800 dark:text-gray-100'
                            }`}
                        >
                            {m.role === 'model' ? (
                                <div 
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: md.render(m.text) }} 
                                />
                            ) : (
                                m.text
                            )}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about this component..."
                        disabled={isThinking}
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-emerald-500 rounded-lg text-sm outline-none transition-all dark:text-white"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="absolute right-2 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isThinking ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
