
import React, { useState, useEffect } from 'react';
import { Check, Loader2, ScanSearch, Activity, FileCheck, CheckCircle2, AlertTriangle, XCircle, Eye, ShieldCheck } from 'lucide-react';

interface ProcessIndicatorProps {
    status?: 'running' | 'complete' | 'error';
    result?: any;
}

export const ProcessIndicator: React.FC<ProcessIndicatorProps> = ({ status = 'running', result }) => {
    // New Workflow Steps
    const steps = [
        { icon: ScanSearch, label: "Scanning Netlist Structure" },
        { icon: Eye, label: "Analyzing Visual Layout" },
        { icon: Activity, label: "Running Electrical Simulation" },
        { icon: ShieldCheck, label: "Verifying Design Rules" },
        { icon: FileCheck, label: "Compiling Final Report" }
    ];

    // If complete, start at the end. Otherwise start at 0.
    const [step, setStep] = useState(status === 'complete' ? steps.length : 0);

    useEffect(() => {
        if (status === 'complete') {
            setStep(steps.length);
            return;
        }
        
        // Slightly faster interval to accommodate more steps
        const interval = setInterval(() => {
            setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 600);
        return () => clearInterval(interval);
    }, [status, steps.length]);

    const isComplete = status === 'complete';
    
    // Check results if available (from validate_circuit tool)
    const failures = result?.circuitHealth?.failures || 0;
    const warnings = result?.circuitHealth?.warnings || 0;
    const hasIssues = failures > 0 || warnings > 0;

    return (
        <div className={`w-full bg-white dark:bg-gray-800 rounded-lg p-3 border ${isComplete ? (hasIssues ? 'border-amber-200 dark:border-amber-900/30' : 'border-green-200 dark:border-green-900/30') : 'border-blue-200 dark:border-blue-900/30'} my-2 shadow-sm transition-all duration-500`}>
            
            {/* Header / Status Line */}
            <div className={`text-xs font-bold ${
                isComplete 
                    ? (hasIssues ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400') 
                    : 'text-blue-600 dark:text-blue-400'
                } mb-3 uppercase tracking-wider flex items-center justify-between gap-2`}
            >
                <div className="flex items-center gap-2">
                    {isComplete ? (
                        hasIssues ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {isComplete ? "Electrical Analysis Complete" : "Running Full Validation"}
                </div>
                
                {/* Score Badge (Only when complete and we have results) */}
                {isComplete && result && (
                    <div className="flex gap-2">
                        {failures > 0 && (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <XCircle className="w-3 h-3" /> {failures}
                            </span>
                        )}
                        {warnings > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3 h-3" /> {warnings}
                            </span>
                        )}
                        {failures === 0 && warnings === 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3" /> All Pass
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* List of Steps (Only show while running or if no result available yet) */}
            {(!isComplete || !result) && (
                <div className="space-y-2.5">
                    {steps.map((s, i) => {
                        const isDone = isComplete || i < step;
                        const isCurrent = !isComplete && i === step;
                        const Icon = s.icon;
                        return (
                            <div key={i} className={`flex items-center gap-3 text-xs transition-all duration-300 ${isCurrent ? 'text-gray-900 dark:text-white font-medium translate-x-1' : isDone ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                <div className={`w-4 h-4 flex items-center justify-center rounded-full border transition-colors duration-300 ${
                                    isDone ? 'bg-green-500 border-green-500 text-white' : 
                                    isCurrent ? 'border-blue-500 text-blue-500 animate-pulse' : 
                                    'border-gray-200 dark:border-gray-700'
                                }`}>
                                    {isDone ? <Check className="w-2.5 h-2.5" /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-current' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                                </div>
                                <span className="flex items-center gap-2">
                                    {isCurrent && <Icon className="w-3 h-3 animate-pulse text-blue-500" />}
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
