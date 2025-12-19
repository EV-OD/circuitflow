
import React, { useMemo, useState } from 'react';
import { CircuitComponent } from '../../../types';
import { 
    Activity, 
    Table2, 
    Search, 
    Play, 
    RefreshCw, 
    Cpu, 
    Zap, 
    Microscope 
} from 'lucide-react';

interface LabSidebarProps {
    components: CircuitComponent[];
    onSelectComponent: (id: string) => void;
    selectedComponentId: string | null;
    activeTab: 'overview' | 'graph' | 'table';
    onSelectTab: (tab: 'overview' | 'graph' | 'table') => void;
    onRun: () => void;
    isRunning: boolean;
    hasResults: boolean;
}

export const LabSidebar: React.FC<LabSidebarProps> = ({
    components,
    onSelectComponent,
    selectedComponentId,
    activeTab,
    onSelectTab,
    onRun,
    isRunning,
    hasResults
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredComponents = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return components.filter(c => 
            (c.designator || '').toLowerCase().includes(term) ||
            (c.definitionType || '').toLowerCase().includes(term)
        ).sort((a, b) => (a.designator || '').localeCompare(b.designator || ''));
    }, [components, searchTerm]);

    return (
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Header / Run Control */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-purple-600" />
                    Lab Analysis
                </h3>
                <button
                    onClick={onRun}
                    disabled={isRunning}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                    {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isRunning ? 'Simulating...' : hasResults ? 'Rerun Simulation' : 'Run Simulation'}
                </button>
            </div>

            {/* General Views */}
            <div className="p-2 space-y-1 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => onSelectTab('overview')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview' && !selectedComponentId
                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    Overview
                </button>
                <button
                    onClick={() => onSelectTab('graph')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'graph'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Zap className="w-4 h-4" />
                    Full Graph
                </button>
                <button
                    onClick={() => onSelectTab('table')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'table'
                            ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <Table2 className="w-4 h-4" />
                    Raw Data
                </button>
            </div>

            {/* Component List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Filter components..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-gray-200"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Components ({filteredComponents.length})
                    </div>
                    {filteredComponents.map(comp => (
                        <button
                            key={comp.id}
                            onClick={() => onSelectComponent(comp.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left group ${
                                selectedComponentId === comp.id
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                            }`}
                        >
                            <Cpu className={`w-3.5 h-3.5 shrink-0 ${selectedComponentId === comp.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                            <div className="truncate">
                                <span className="font-semibold font-mono">{comp.designator}</span>
                                <span className="ml-2 text-xs opacity-70">{comp.definitionType}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
