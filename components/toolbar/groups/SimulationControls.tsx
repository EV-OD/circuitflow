
import React, { useState, useRef, useEffect } from 'react';
import { Play, Settings2, FileCode, TerminalSquare, Sparkles, FlaskConical, ChevronDown, Wrench, MessageSquare, FileText, CheckCircle2, Wand2 } from 'lucide-react';
import { useCircuit } from '../../../context/CircuitContext';
import { useSimulationRunner } from '../../../hooks/useSimulationRunner';
import { useAgent } from '../../../hooks/useAgent';
import { SimulationConfigModal } from '../../modals/SimulationConfigModal';
import { generateSpiceNetlist } from '../../../services/netlistGenerator';
import { NgSpiceDebugModal } from '../../debug/NgSpiceDebugModal';
import { CodeEditor } from '../../ui/CodeEditor';
import { Modal } from '../../ui/Modal';
import { getSimulationDirective } from '../../../simulation/control';
import { ReportModal } from '../../reports/ReportModal';

interface SimulationControlsProps {
    saveName: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({ saveName }) => {
  const { simulationConfig, components, wires, customDefinitions, setIsLabOpen, isLabOpen, reports, redesignCircuit } = useCircuit();
  const { isSimulating, executeSimulation } = useSimulationRunner();
  const { sendMessage, setIsOpen, isOpen: isAgentOpen, setAgentMode } = useAgent();
  
  // Modals State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Dropdown States
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  const toolsRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  // State for code/netlist generation
  const [generatedCode, setGeneratedCode] = useState('');
  const [simulationNetlist, setSimulationNetlist] = useState<string | undefined>(undefined);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) setIsToolsOpen(false);
      if (aiRef.current && !aiRef.current.contains(event.target as Node)) setIsAIOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for custom event from Chat to open reports
  useEffect(() => {
      const handler = () => setIsReportModalOpen(true);
      document.addEventListener('open-report-history', handler);
      return () => document.removeEventListener('open-report-history', handler);
  }, []);

  const handleRunClick = () => {
      if (simulationConfig) {
          executeSimulation(simulationConfig, saveName);
      } else {
          setIsConfigModalOpen(true);
      }
  };

  const handleOpenCode = () => {
    const directive = getSimulationDirective(simulationConfig || { 
        type: 'TRAN', 
        transient: { stopTime: '10ms', stepTime: '10us', startTime: '0' },
        dc: { source: 'V1', start: '0', stop: '5', increment: '0.1' }
    });
    const { netlist } = generateSpiceNetlist(components, wires, saveName, directive, customDefinitions);
    setGeneratedCode(netlist);
    setIsCodeModalOpen(true);
    setIsToolsOpen(false);
  };

  const handleOpenDebug = () => {
      const directive = getSimulationDirective(simulationConfig || { 
        type: 'TRAN', 
        transient: { stopTime: '10ms', stepTime: '10us', startTime: '0' },
        dc: { source: 'V1', start: '0', stop: '5', increment: '0.1' }
    });
      const { netlist } = generateSpiceNetlist(components, wires, saveName, directive, customDefinitions);
      setSimulationNetlist(netlist);
      setIsSimModalOpen(true);
      setIsToolsOpen(false);
  };

  const handleToggleLab = () => {
      setIsLabOpen(!isLabOpen);
      setIsToolsOpen(false);
  };

  const handleAISimulation = () => {
      setAgentMode('auditor'); // Enforce strict validation mode
      setIsOpen(true);
      sendMessage("Validate Circuit");
      setIsAIOpen(false);
  };

  const handleToggleAI = () => {
      setIsOpen(!isAgentOpen);
      setIsAIOpen(false);
  };

  return (
    <>
        <div className="flex items-center space-x-3">
           
           {/* Reports Button */}
           <button 
                onClick={() => setIsReportModalOpen(true)}
                className={`p-2 rounded-md transition-colors relative ${
                    isReportModalOpen 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="View Analysis Reports"
           >
                <FileText className="w-5 h-5" />
                {reports.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
           </button>

           <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

           {/* AI Split Button */}
           <div className="relative flex items-center shadow-sm rounded-md" ref={aiRef}>
                <button
                    onClick={handleToggleAI}
                    className={`flex items-center gap-2 px-3 py-2 rounded-l-md border border-r-0 transition-all ${
                        isAgentOpen 
                        ? 'bg-gradient-to-r from-violet-700 to-purple-800 text-white border-transparent hover:to-purple-900' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Toggle CircuitAI Panel"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium hidden md:inline">CircuitAI</span>
                </button>
                <button
                    onClick={() => setIsAIOpen(!isAIOpen)}
                    className={`px-1.5 py-2 rounded-r-md border-l border transition-all ${
                        isAgentOpen 
                        ? 'bg-purple-800 text-white border-l-black/20 border-transparent hover:bg-purple-900' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isAIOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={handleToggleAI}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <MessageSquare className="w-4 h-4 text-violet-500" />
                            <span>{isAgentOpen ? 'Close Chat' : 'Open Chat'}</span>
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-800" />
                        <button 
                            onClick={handleAISimulation}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <CheckCircle2 className="w-4 h-4 text-fuchsia-500" />
                            <span>Run Full Validation</span>
                        </button>
                    </div>
                )}
           </div>

           {/* Tools Dropdown */}
           <div className="relative" ref={toolsRef}>
               <button 
                   onClick={() => setIsToolsOpen(!isToolsOpen)}
                   className={`flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${isToolsOpen ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                   title="Advanced Tools"
               >
                   <Wrench className="w-4 h-4" />
                   <span className="text-sm font-medium hidden lg:inline">Tools</span>
                   <ChevronDown className="w-3.5 h-3.5 opacity-70" />
               </button>

               {isToolsOpen && (
                   <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                       <button 
                           onClick={() => { redesignCircuit(); setIsToolsOpen(false); }}
                           className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                       >
                           <Wand2 className="w-4 h-4 text-pink-500" />
                           <span>Magic Route</span>
                       </button>
                       <div className="h-px bg-gray-100 dark:bg-gray-800" />
                       <button 
                           onClick={handleOpenCode}
                           className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                       >
                           <FileCode className="w-4 h-4 text-blue-500" />
                           <span>SPICE Netlist</span>
                       </button>
                       <div className="h-px bg-gray-100 dark:bg-gray-800" />
                       <button 
                           onClick={handleOpenDebug}
                           className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                       >
                           <TerminalSquare className="w-4 h-4 text-purple-500" />
                           <span>Sim Debugger</span>
                       </button>
                       <div className="h-px bg-gray-100 dark:bg-gray-800" />
                       <button 
                           onClick={handleToggleLab}
                           className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                       >
                           <FlaskConical className="w-4 h-4 text-orange-500" />
                           <span>{isLabOpen ? 'Close Lab Mode' : 'Open Lab Mode'}</span>
                       </button>
                   </div>
               )}
           </div>

          <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

          {/* Run Actions */}
          <div className="flex items-center">
             <button 
                 onClick={handleRunClick}
                 className={`flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-l-md transition-all shadow-sm hover:shadow active:scale-95 border-r border-green-700 ${isSimulating ? 'opacity-70 cursor-wait' : ''}`}
                 title={simulationConfig ? "Run Last Configuration" : "Configure & Run"}
                 disabled={isSimulating}
             >
                 {isSimulating ? (
                     <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold">Running...</span>
                     </>
                 ) : (
                     <>
                        <Play className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">Run</span>
                     </>
                 )}
             </button>
             <button
                 onClick={() => setIsConfigModalOpen(true)}
                 className="px-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-r-md transition-all shadow-sm hover:shadow"
                 title="Configure Simulation Settings"
             >
                 <Settings2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Modals */}
        <Modal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} title="SPICE Netlist">
            <div className="h-96">
                <CodeEditor code={generatedCode} />
            </div>
        </Modal>

        <SimulationConfigModal 
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onRun={(cfg) => executeSimulation(cfg, saveName)}
        />

        <NgSpiceDebugModal 
          isOpen={isSimModalOpen} 
          onClose={() => setIsSimModalOpen(false)} 
          initialNetlist={simulationNetlist}
        />

        <ReportModal 
            isOpen={isReportModalOpen} 
            onClose={() => setIsReportModalOpen(false)} 
        />
    </>
  );
};
