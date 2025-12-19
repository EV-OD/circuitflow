
import React from 'react';
import { X, Activity, MessageSquare, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { useAgent } from '../../hooks/useAgent';

interface UsageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageInfoModal: React.FC<UsageInfoModalProps> = ({ isOpen, onClose }) => {
  const { usageMetrics } = useAgent();
  
  if (!isOpen) return null;

  const total = usageMetrics.inputTokens + usageMetrics.outputTokens;
  const inputPercent = total > 0 ? (usageMetrics.inputTokens / total) * 100 : 0;
  const outputPercent = total > 0 ? (usageMetrics.outputTokens / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Session Usage
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 space-y-6">
            
            {/* Main Counters */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Requests
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {usageMetrics.totalRequests}
                    </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <Activity className="w-3.5 h-3.5" />
                        Total Tokens
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {total.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Token Breakdown Chart */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Token Distribution</h4>
                
                {/* Visual Bar */}
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${inputPercent}%` }} 
                    />
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${outputPercent}%` }} 
                    />
                </div>

                {/* Legend */}
                <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                        <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{usageMetrics.inputTokens.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">Input (Prompt)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                        <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{usageMetrics.outputTokens.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">Output (Response)</div>
                        </div>
                        <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Footer / External Links */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                <span>Model: Gemini 2.5 Flash</span>
                <a 
                    href="https://aistudio.google.com/app/plan_information" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                >
                    Manage Quota <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};
