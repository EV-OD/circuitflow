
import React from 'react';
import { useAgent } from '../../hooks/useAgent';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

export const CopilotPanel: React.FC = () => {
  const { isOpen, setIsOpen, messages, isThinking, sendMessage, clearMessages } = useAgent();

  if (!isOpen) return null;

  const suggestionChips = [
      "Make a voltage divider",
      "Design an RC filter",
      "Create an LED blinker",
      "Run QA check"
  ];

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-2xl relative z-50">
        <ChatHeader onClose={() => setIsOpen(false)} onClear={clearMessages} />
        <MessageList messages={messages} isThinking={isThinking} />
        <ChatInput 
            onSend={sendMessage} 
            isThinking={isThinking} 
            suggestionChips={suggestionChips}
        />
    </div>
  );
};
