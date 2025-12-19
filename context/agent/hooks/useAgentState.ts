
import { useState } from 'react';
import { ChatMessage, AgentUsageMetrics, AgentMode } from '../../../types';

export const useAgentState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>('builder'); // Default to Builder mode
  const [messages, setMessages] = useState<ChatMessage[]>([{
      id: 'init',
      role: 'model',
      content: "Hello! I'm your Engineering Assistant. I can help you build circuits or run strict validation checks.",
      timestamp: Date.now()
  }]);
  const [isThinking, setIsThinking] = useState(false);
  
  const [usageMetrics, setUsageMetrics] = useState<AgentUsageMetrics>({
      inputTokens: 0,
      outputTokens: 0,
      totalRequests: 0
  });

  const clearMessages = () => {
      setMessages([{
          id: 'init',
          role: 'model',
          content: "Hello! I'm your Engineering Assistant. I can help you build circuits or run strict validation checks.",
          timestamp: Date.now()
      }]);
  };

  const updateUsageMetrics = (input: number, output: number) => {
      setUsageMetrics(prev => ({
          inputTokens: prev.inputTokens + input,
          outputTokens: prev.outputTokens + output,
          totalRequests: prev.totalRequests + 1
      }));
  };

  return {
      isOpen, setIsOpen,
      agentMode, setAgentMode,
      messages, setMessages,
      isThinking, setIsThinking,
      clearMessages,
      usageMetrics,
      updateUsageMetrics
  };
};
