
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    isThinking: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isThinking }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950/50">
            {messages.map((msg) => (
                <MessageItem key={msg.id} msg={msg} />
            ))}
            
            {isThinking && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};
