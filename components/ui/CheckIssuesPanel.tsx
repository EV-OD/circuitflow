
import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, List, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';

export const CheckIssuesPanel: React.FC = () => {
    const { currentIssues, selectComponent, viewport, setViewport } = useCircuit();
    const [isOpen, setIsOpen] = useState(false);

    if (currentIssues.length === 0) return null;

    const errorCount = currentIssues.filter(i => i.severity === 'error').length;
    const warnCount = currentIssues.filter(i => i.severity === 'warning').length;

    const handleFocus = (issue: any) => {
        if (issue.componentId) {
            selectComponent(issue.componentId, false);
        }
        if (issue.location) {
            setViewport(prev => ({
                ...prev,
                x: -issue.location.x * prev.k + window.innerWidth / 2,
                y: -issue.location.y * prev.k + window.innerHeight / 2
            }));
        }
    };

    return (
        <div className="absolute bottom-4 left-4 z-40 flex flex-col items-start gap-2">
            
            {/* Popover List */}
            {isOpen && (
                <div className="w-80 max-h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">Design Issues ({currentIssues.length})</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                        {currentIssues.map((issue, i) => (
                            <button 
                                key={issue.id + i}
                                onClick={() => handleFocus(issue)}
                                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex gap-3 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                <div className="shrink-0 mt-0.5">
                                    {issue.severity === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                    {issue.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                    {issue.severity === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                                </div>
                                <div>
                                    <div className={`text-xs font-bold ${
                                        issue.severity === 'error' ? 'text-red-600 dark:text-red-400' :
                                        issue.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {issue.rule}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {issue.message}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to locate
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg transition-all border
                    ${errorCount > 0 
                        ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 animate-pulse-slow' 
                        : warnCount > 0 
                            ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                `}
            >
                <div className="flex items-center gap-1.5">
                    {errorCount > 0 && <AlertCircle className="w-4 h-4" />}
                    {errorCount === 0 && warnCount > 0 && <AlertTriangle className="w-4 h-4" />}
                    
                    <span className="font-bold text-sm">
                        {errorCount + warnCount} Issues
                    </span>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 opacity-80" /> : <ChevronUp className="w-4 h-4 opacity-80" />}
            </button>
        </div>
    );
};
