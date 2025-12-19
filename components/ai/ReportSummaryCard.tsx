
import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, XCircle, ArrowRight, Activity } from 'lucide-react';

interface ReportSummaryCardProps {
    title: string;
    summary: string;
    problems?: string | string[];
    recommendations?: string | string[];
    tags?: string[];
}

export const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({ 
    title, 
    summary, 
    problems, 
    recommendations,
    tags = []
}) => {
    // Helper to extract list items from markdown string or array
    const extractList = (input: any) => {
        if (!input) return [];
        
        // Handle array input (e.g. from JSON output of AI)
        if (Array.isArray(input)) {
            return input.map(item => String(item).replace(/^[-*]\s+/, '')).slice(0, 3);
        }

        // Handle non-string input gracefully
        if (typeof input !== 'string') return [];

        return input.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.startsWith('*'))
            .map(line => line.replace(/^[-*]\s+/, ''))
            .slice(0, 3); // Top 3 only
    };

    const problemList = extractList(problems);
    const recList = extractList(recommendations);

    // Determine overall status based on tags or extracted content
    // Fallback: If tags are missing but problems exist, mark as FAIL unless explicitly marked PASS/WARN
    const isFail = tags.includes('FAIL') || tags.includes('Critical') || (problemList.length > 0 && !tags.includes('PASS') && !tags.includes('WARN'));
    const isWarn = tags.includes('WARN') || tags.includes('Warning');
    const isPass = tags.includes('PASS') || (!isFail && !isWarn);

    const borderColor = isFail ? 'border-red-200 dark:border-red-900' : 
                       isWarn ? 'border-amber-200 dark:border-amber-900' : 
                       'border-green-200 dark:border-green-900';
    
    const bgColor = isFail ? 'bg-red-50/50 dark:bg-red-950/20' : 
                   isWarn ? 'bg-amber-50/50 dark:bg-amber-950/20' : 
                   'bg-green-50/50 dark:bg-green-950/20';

    const Icon = isFail ? XCircle : isWarn ? AlertTriangle : CheckCircle2;
    const iconColor = isFail ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-green-500';

    return (
        <div className={`w-full rounded-xl border ${borderColor} ${bgColor} overflow-hidden shadow-sm my-2`}>
            {/* Header */}
            <div className="px-4 py-3 flex items-start justify-between border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                            Validation Report
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => document.dispatchEvent(new CustomEvent('open-report-history'))}
                    className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg text-gray-500 transition-colors"
                    title="Open Full Report"
                >
                    <FileText className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-300">{summary}</p>

                {problemList.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Issues Found
                        </div>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                            {problemList.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {recList.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Recommendations
                        </div>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                            {recList.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="px-4 py-2 bg-white/50 dark:bg-black/10 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end">
                <button 
                    onClick={() => document.dispatchEvent(new CustomEvent('open-report-history'))}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                    View Details <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};
