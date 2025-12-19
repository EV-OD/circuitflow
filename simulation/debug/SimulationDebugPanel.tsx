
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { startSimulation } from '../control';
import { SimulationRunResult } from '../types';
import { COMPONENT_LIBRARY } from '../../constants';

// Sub-components
import { LabSidebar } from './lab/LabSidebar';
import { ComponentAnalysis } from './lab/views/ComponentAnalysis';
import { SimulationGraph } from '../../components/debug/SimulationGraph';
import { SimulationResults } from '../../components/debug/SimulationResults';

export const SimulationDebugPanel: React.FC = () => {
    const { 
        components, 
        wires, 
        customDefinitions, 
        simulationConfig, 
        isLabOpen, 
        setIsLabOpen 
    } = useCircuit();

    const [result, setResult] = useState<SimulationRunResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    
    // View State
    const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'table'>('overview');
    const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

    // Initial Auto-Run on Open if no results
    useEffect(() => {
        if (isLabOpen && !result && simulationConfig) {
            handleRun();
        }
    }, [isLabOpen]);

    if (!isLabOpen) return null;

    const handleRun = async () => {
        if (!simulationConfig) return;
        setIsRunning(true);
        try {
            const res = await startSimulation(simulationConfig, { components, wires, definitions: customDefinitions });
            setResult(res);
        } catch (e: any) {
            console.error(e);
            alert(`Simulation failed: ${e.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleSelectComponent = (id: string) => {
        setSelectedComponentId(id);
        setActiveTab('overview'); // Switch to analysis view
    };

    const handleTabChange = (tab: 'overview' | 'graph' | 'table') => {
        setActiveTab(tab);
        if (tab !== 'overview') setSelectedComponentId(null);
    };

    // Derived Component Data
    const selectedComponent = components.find(c => c.id === selectedComponentId);
    const selectedDefinition = selectedComponent 
        ? ([...COMPONENT_LIBRARY, ...customDefinitions].find(d => d.type === selectedComponent.definitionType))
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full h-full max-w-[1600px] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                
                {/* Top Bar (Mobile Close / Status) */}
                <div className="md:hidden flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                    <span className="font-bold text-gray-700 dark:text-gray-200">Lab Workbench</span>
                    <button onClick={() => setIsLabOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <LabSidebar 
                        components={components}
                        onSelectComponent={handleSelectComponent}
                        selectedComponentId={selectedComponentId}
                        activeTab={activeTab}
                        onSelectTab={handleTabChange}
                        onRun={handleRun}
                        isRunning={isRunning}
                        hasResults={!!result}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-gray-900">
                        <div className="absolute top-4 right-4 z-10 hidden md:block">
                            <button 
                                onClick={() => setIsLabOpen(false)} 
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Switcher */}
                        {isRunning ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Running SPICE Simulation...</p>
                            </div>
                        ) : !result ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                                    <X className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="text-lg font-medium">No results yet</p>
                                <button onClick={handleRun} className="mt-4 text-blue-500 hover:underline">Start Simulation</button>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && selectedComponent && selectedDefinition ? (
                                    <ComponentAnalysis 
                                        result={result}
                                        component={selectedComponent}
                                        definition={selectedDefinition}
                                        customDefinitions={customDefinitions}
                                    />
                                ) : activeTab === 'overview' ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                        <p>Select a component from the sidebar to analyze.</p>
                                    </div>
                                ) : activeTab === 'graph' ? (
                                    <div className="flex-1 p-4">
                                        <SimulationGraph data={result.data} />
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-hidden">
                                        <SimulationResults data={result.data} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
