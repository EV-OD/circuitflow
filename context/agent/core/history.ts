
import { ChatMessage } from '../../../types';

export const prepareHistoryForModel = (messages: ChatMessage[]): any[] => {
    // 1. Slice: Only keep recent context to avoid token limits (e.g. last 15 messages)
    // 2. Filter: Remove the initial system greeting (index 0) if it's purely UI
    // 3. Map: Convert to Gemini format
    return messages.slice(1).slice(-15).map(m => {
        let contentText = m.content;
        
        // Provide a placeholder for tool-only messages so the model sees the turn structure correctly
        if (!contentText && m.toolCalls && m.toolCalls.length > 0) {
            contentText = `[System: Executed ${m.toolCalls.length} tools successfully]`;
        }
        
        return {
            role: m.role as 'user' | 'model',
            parts: [{ text: contentText || "" }]
        };
    }).filter(m => m.parts[0].text !== "");
};
