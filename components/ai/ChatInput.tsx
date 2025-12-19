
import React, { useState } from 'react';
import { Send, StopCircle } from 'lucide-react';

interface ChatInputProps {
    onSend: (text: string) => void;
    isThinking: boolean;
    suggestionChips: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isThinking, suggestionChips }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim() || isThinking) return;
        onSend(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            {!isThinking && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-linear-fade-right">
                    {suggestionChips.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSend(chip)}
                            className="flex-shrink-0 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-full text-[11px] text-gray-600 dark:text-gray-300 transition-colors whitespace-nowrap font-medium"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            )}

            <div className="relative flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your circuit..."
                    disabled={isThinking}
                    className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-gray-800/80 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-violet-500/50 rounded-xl text-sm outline-none transition-all dark:text-white disabled:opacity-50 shadow-inner"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="absolute right-2 p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors shadow-sm"
                >
                    {isThinking ? <StopCircle className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};
