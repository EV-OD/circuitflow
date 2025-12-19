
import React, { createContext, useContext, ReactNode } from 'react';
import { ChatMessage, AgentUsageMetrics, AgentMode } from '../types';
import { useAgentState } from './agent/hooks/useAgentState';
import { useAgentTools } from './agent/hooks/useAgentTools';
import { useAgentCore } from './agent/hooks/useAgentCore';

interface AgentContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  messages: ChatMessage[];
  isThinking: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  usageMetrics: AgentUsageMetrics;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
      isOpen, setIsOpen, 
      agentMode, setAgentMode,
      messages, setMessages, 
      isThinking, setIsThinking, 
      clearMessages,
      usageMetrics, updateUsageMetrics
  } = useAgentState();

  const { executeTools } = useAgentTools();

  const { sendMessage } = useAgentCore({
      messages,
      agentMode,
      setMessages,
      setIsThinking,
      executeTools,
      updateUsageMetrics
  });

  return (
    <AgentContext.Provider value={{ 
        isOpen, setIsOpen, 
        agentMode, setAgentMode,
        messages, isThinking, sendMessage, clearMessages, usageMetrics 
    }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) throw new Error("useAgent must be used within AgentProvider");
  return context;
};
