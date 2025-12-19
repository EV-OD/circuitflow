
import React, { useState } from 'react';
import { CheckCircle2, Loader2, Wrench, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ToolCallSummary } from '../../types';
import { ProcessIndicator } from './ProcessIndicator';
import { ReportSummaryCard } from './ReportSummaryCard';

interface ToolCallDisplayProps {
    toolCalls: ToolCallSummary[];
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCalls }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (toolCalls.length === 0) return null;

    const formatName = (name: string) => {
        return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    // Helper to render complex args as badges
    const renderArgs = (args: any) => {
        if (!args || Object.keys(args).length === 0) return <span className="text-gray-400 italic">No parameters</span>;

        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(args).map(([key, value]) => {
                    if (value === undefined || value === null) return null;
                    
                    // Skip verbose nested objects in summary view
                    if (typeof value === 'object') {
                        return (
                            <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {key}: <span className="italic ml-1">Configured</span>
                            </span>
                        );
                    }

                    return (
                        <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                            <span className="font-semibold mr-1 opacity-70">{key}:</span> {String(value)}
                        </span>
                    );
                })}
            </div>
        );
    };

    // For large batches (efficiency mode), we only show summary or first few
    const visibleCalls = isExpanded ? toolCalls : toolCalls.slice(0, 3);
    const hiddenCount = toolCalls.length - visibleCalls.length;
    const isLargeBatch = toolCalls.length > 3;

    return (
        <div className="flex flex-col gap-2 w-full my-1">
            {visibleCalls.map((call, i) => {
                // 1. Special Handling for complex workflows
                // Trigger indicator on the main analysis step
                if (call.name === 'run_electrical_analysis' || call.name === 'validate_circuit') {
                    return <ProcessIndicator key={i} status={call.status as any} result={call.result} />;
                }

                if (call.name === 'submit_circuit_report' && call.status === 'complete') {
                    return (
                        <ReportSummaryCard 
                            key={i}
                            title={call.args.title}
                            summary={call.args.summary}
                            problems={call.args.sections?.problems}
                            recommendations={call.args.sections?.recommendations}
                            tags={call.args.tags}
                        />
                    );
                }

                // 2. Generic Dynamic Display
                const isError = call.status === 'error' || (call.result && call.result.error);
                
                return (
                    <div 
                        key={i} 
                        className={`
                            relative flex flex-col gap-1 p-2 rounded-lg border text-xs transition-all
                            ${isError 
                                ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
                                : 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <div className="shrink-0">
                                {call.status === 'running' ? (
                                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                ) : isError ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                    <Wrench className="w-3.5 h-3.5 text-gray-400" />
                                )}
                            </div>
                            
                            <span className="font-bold text-gray-700 dark:text-gray-200">
                                {formatName(call.name)}
                            </span>
                            
                            {call.status === 'complete' && !isError && (
                                <span className="ml-auto text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                </span>
                            )}
                        </div>

                        {/* Arguments */}
                        <div className="pl-5">
                            {renderArgs(call.args)}
                        </div>

                        {/* Error Message */}
                        {isError && (call.result?.error || "Tool failed") && (
                            <div className="mt-1 pl-5 text-red-600 dark:text-red-400 font-mono text-[10px]">
                                Error: {call.result?.error}
                            </div>
                        )}
                        
                        {/* Result Preview (Optional, for simple returns) */}
                        {call.status === 'complete' && !isError && call.result?.message && (
                            <div className="mt-1 pl-5 text-gray-500 dark:text-gray-400 flex items-center gap-1 text-[10px]">
                                <ArrowRight className="w-2.5 h-2.5" />
                                {call.result.message}
                            </div>
                        )}
                    </div>
                );
            })}

            {isLargeBatch && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center gap-2 w-full py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-md transition-colors font-medium border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-3 h-3" /> Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3" /> Show {hiddenCount} More Operations
                        </>
                    )}
                </button>
            )}
        </div>
    );
};
