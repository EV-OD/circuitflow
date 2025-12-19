
import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Calendar, Tag, ChevronRight, CheckSquare, Table2, Activity, Zap } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { CircuitReport } from '../../types';
import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';
import { SimulationGraph } from '../debug/SimulationGraph';
import { SimulationResults } from '../debug/SimulationResults';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const { reports } = useCircuit();
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'report' | 'graphs' | 'data'>('report');

    // Auto-select latest if none selected
    useEffect(() => {
        if (isOpen && !selectedReportId && reports.length > 0) {
            setSelectedReportId(reports[0].id);
        }
    }, [isOpen, reports, selectedReportId]);

    const md = useMemo(() => {
        const parser = new MarkdownIt({
            html: false,
            linkify: true,
            typographer: true
        });
        parser.use(mk);
        
        // Custom Table Rendering
        parser.renderer.rules.table_open = () => '<div class="overflow-x-auto my-2 rounded border border-gray-200 dark:border-gray-700"><table class="min-w-full text-left border-collapse">';
        parser.renderer.rules.table_close = () => '</table></div>';
        
        return parser;
    }, []);

    if (!isOpen) return null;

    const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full h-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row">
                
                {/* Sidebar (History) */}
                <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            Reports
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {reports.length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-400">No reports generated yet.</div>
                        )}
                        {reports.map(report => (
                            <button
                                key={report.id}
                                onClick={() => { setSelectedReportId(report.id); setActiveTab('report'); }}
                                className={`w-full text-left p-3 rounded-lg text-sm transition-colors group ${
                                    selectedReport?.id === report.id
                                        ? 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-purple-500/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-900'
                                }`}
                            >
                                <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{report.title}</div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(report.timestamp).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                        <div>
                            {selectedReport ? (
                                <>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.title}</h2>
                                    <div className="flex gap-2 mt-2">
                                        {selectedReport.tags?.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-full border border-purple-100 dark:border-purple-800/30 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <h2 className="text-xl text-gray-400">Select a report</h2>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    {selectedReport && (
                        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 bg-gray-50/30 dark:bg-gray-900/30 shrink-0">
                            <TabButton 
                                active={activeTab === 'report'} 
                                onClick={() => setActiveTab('report')} 
                                icon={FileText} 
                                label="Analysis Report" 
                            />
                            {selectedReport.simulationData && (
                                <>
                                    <TabButton 
                                        active={activeTab === 'graphs'} 
                                        onClick={() => setActiveTab('graphs')} 
                                        icon={Activity} 
                                        label="Graphs" 
                                    />
                                    <TabButton 
                                        active={activeTab === 'data'} 
                                        onClick={() => setActiveTab('data')} 
                                        icon={Table2} 
                                        label="Raw Data" 
                                    />
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50/30 dark:bg-black/10">
                        {selectedReport && activeTab === 'report' && (
                            <div className="p-8 max-w-4xl mx-auto space-y-8">
                                <Section title="Executive Summary" content={selectedReport.summary} md={md} />
                                <Section title="Overview" content={selectedReport.sections.overall} md={md} />
                                
                                {selectedReport.sections.problems && (
                                    <Section title="Issues Found" content={selectedReport.sections.problems} type="danger" md={md} />
                                )}
                                
                                {selectedReport.sections.recommendations && (
                                    <div className="rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10 p-6">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4" /> Recommendations
                                        </h3>
                                        <div 
                                            className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                                            dangerouslySetInnerHTML={{ __html: md.render(selectedReport.sections.recommendations) }} 
                                        />
                                    </div>
                                )}

                                {/* Measurements Data Table */}
                                {selectedReport.measurements && Object.keys(selectedReport.measurements).length > 0 && (
                                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                                            <Zap className="w-4 h-4" /> Key Measurements
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                                        <th className="pb-2 font-medium">Metric</th>
                                                        <th className="pb-2 font-medium text-right">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {Object.entries(selectedReport.measurements).map(([key, value]) => (
                                                        <tr key={key}>
                                                            <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">{key.replace(/_/g, ' ')}</td>
                                                            <td className="py-2 text-right font-mono text-gray-600 dark:text-gray-400">{(value as number).toExponential(3)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedReport.sections.warnings && (
                                    <Section title="Warnings" content={selectedReport.sections.warnings} type="warning" md={md} />
                                )}
                                {selectedReport.sections.cautions && (
                                    <Section title="Cautions" content={selectedReport.sections.cautions} type="info" md={md} />
                                )}
                            </div>
                        )}

                        {selectedReport && activeTab === 'graphs' && selectedReport.simulationData && (
                            <div className="h-full p-4">
                                <div className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                    <SimulationGraph data={selectedReport.simulationData} />
                                </div>
                            </div>
                        )}

                        {selectedReport && activeTab === 'data' && selectedReport.simulationData && (
                            <div className="h-full">
                                <SimulationResults data={selectedReport.simulationData} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            active 
            ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const Section: React.FC<{ title: string, content: string, type?: 'default' | 'danger' | 'warning' | 'success' | 'info', md: MarkdownIt }> = ({ title, content, type = 'default', md }) => {
    if (!content) return null;
    
    const colors = {
        default: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        danger: 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10',
        warning: 'border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10',
        success: 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10',
        info: 'border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10'
    };

    return (
        <div className={`rounded-xl border p-6 shadow-sm ${colors[type]}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> {title}
            </h3>
            <div 
                className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: md.render(content) }} 
            />
        </div>
    );
};
