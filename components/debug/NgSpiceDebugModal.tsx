
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, X, TerminalSquare, Table2, FileText, Activity } from 'lucide-react';
import { parseSpiceOutput } from '../../services/spiceParser';
import { SimulationResults } from './SimulationResults';
import { SimulationGraph } from './SimulationGraph';
import { SimulationData } from '../../types';

interface NgSpiceDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNetlist?: string;
}

const DEFAULT_NETLIST = `* Simple RC Filter
V1 in 0 DC 0 AC 1 SIN(0 5 1k)
R1 in out 1k
C1 out 0 1u
.TRAN 0.1m 5m
.PRINT TRAN V(in) V(out)
.END`;

export const NgSpiceDebugModal: React.FC<NgSpiceDebugModalProps> = ({ isOpen, onClose, initialNetlist }) => {
  const [netlist, setNetlist] = useState(initialNetlist || DEFAULT_NETLIST);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationData | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'results' | 'graph'>('logs');
  
  const workerRef = useRef<Worker | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const cachedBlobs = useRef<{ script?: string, wasm?: string }>({});

  useEffect(() => {
    if (isOpen && initialNetlist) {
      setNetlist(initialNetlist);
    } else if (isOpen && !initialNetlist) {
      setNetlist(DEFAULT_NETLIST);
    }
  }, [isOpen, initialNetlist]);

  useEffect(() => {
    if (activeTab === 'logs') {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  useEffect(() => {
    return () => {
      terminateWorker();
      if (cachedBlobs.current.script) URL.revokeObjectURL(cachedBlobs.current.script);
      if (cachedBlobs.current.wasm) URL.revokeObjectURL(cachedBlobs.current.wasm);
      cachedBlobs.current = {};
    };
  }, []);

  const clearLogs = () => {
      setLogs([]);
      setSimulationResult(null);
  };

  const terminateWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const getBlobUrls = async () => {
      if (cachedBlobs.current.script && cachedBlobs.current.wasm) {
          return cachedBlobs.current;
      }

      setLogs(prev => [...prev, 'Loading NGSPICE engine...']);
      
      const [scriptRes, wasmRes] = await Promise.all([
          fetch('/spice/ngspice.js'),
          fetch('/spice/ngspice.wasm')
      ]);

      if (!scriptRes.ok) throw new Error(`Failed to load ngspice.js: ${scriptRes.status}`);
      if (!wasmRes.ok) throw new Error(`Failed to load ngspice.wasm: ${wasmRes.status}`);

      const scriptBlob = new Blob([await scriptRes.arrayBuffer()], { type: 'application/javascript' });
      const wasmBlob = new Blob([await wasmRes.arrayBuffer()], { type: 'application/wasm' });

      const scriptUrl = URL.createObjectURL(scriptBlob);
      const wasmUrl = URL.createObjectURL(wasmBlob);

      cachedBlobs.current = { script: scriptUrl, wasm: wasmUrl };
      return cachedBlobs.current;
  };

  const runSimulation = async () => {
    if (isRunning) return;
    
    terminateWorker();
    
    setIsRunning(true);
    setLogs(prev => [...prev, '--- Starting Simulation ---']);
    setSimulationResult(null);
    setActiveTab('logs'); 

    try {
      const { script: scriptUrl, wasm: wasmUrl } = await getBlobUrls();

      // Matching exact worker code from useSimulationRunner
      const workerCode = `
        self.onmessage = function(e) {
            const { netlist, scriptUrl, wasmUrl } = e.data;
            self.Module = {
                arguments: ['-b', 'input.cir'],
                preRun: [function() { if (self.FS) self.FS.writeFile('input.cir', netlist); }],
                postRun: [function() { self.postMessage({ type: 'done' }); }],
                print: function(text) { if(text) self.postMessage({ type: 'stdout', message: text }); },
                printErr: function(text) { if(text) self.postMessage({ type: 'stderr', message: text }); },
                locateFile: function(path) { return path.endsWith('.wasm') ? wasmUrl : path; }
            };
            try {
                importScripts(scriptUrl);
            } catch (e) {
                self.postMessage({ type: 'stderr', message: 'Worker Import Error: ' + e.toString() });
            }
        };
      `;

      const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
      const workerBlobUrl = URL.createObjectURL(workerBlob);

      const worker = new Worker(workerBlobUrl);
      workerRef.current = worker;

      let fullOutput = "";

      worker.onmessage = (e) => {
          const { type, message } = e.data;
          if (type === 'stdout') {
              setLogs(prev => [...prev, message]);
              fullOutput += message + "\n";
          } else if (type === 'stderr') {
              setLogs(prev => [...prev, `ERR: ${message}`]);
              // Don't append stderr to fullOutput for parsing unless strictly necessary
              // but parsing logic usually expects stdout content. 
              // Some spice versions might output to stderr, but usually data is stdout.
          } else if (type === 'done') {
              setLogs(prev => [...prev, '--- Simulation Completed ---']);
              setIsRunning(false);
              
              const parsed = parseSpiceOutput(fullOutput);
              if (parsed) {
                  setSimulationResult(parsed);
                  setActiveTab('graph'); // Switch to graph automatically if we have data
              }

              worker.terminate();
              if (workerRef.current === worker) workerRef.current = null;
              URL.revokeObjectURL(workerBlobUrl);
          }
      };
      
      worker.onerror = (e) => {
          setLogs(prev => [...prev, `Worker Error: ${e.message}`]);
          setIsRunning(false);
          worker.terminate();
          URL.revokeObjectURL(workerBlobUrl);
      };

      worker.postMessage({ 
          netlist, 
          scriptUrl, 
          wasmUrl 
      });

    } catch (e: any) {
      setLogs(prev => [...prev, `Setup Error: ${e.message}`]);
      setIsRunning(false);
    }
  };

  const stopSimulation = () => {
      terminateWorker();
      setIsRunning(false);
      setLogs(prev => [...prev, '--- Simulation Stopped by User ---']);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
         {/* Header */}
         <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-purple-600" />
                {initialNetlist ? 'Circuit Simulation' : 'NGSPICE Debugger'}
            </h3>
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 flex overflow-hidden">
            {/* Editor (Left Pane) */}
            <div className="w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800 hidden lg:flex">
                <div className="p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500">
                    NETLIST INPUT
                </div>
                <textarea 
                    className="flex-1 p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
                    value={netlist}
                    onChange={(e) => setNetlist(e.target.value)}
                    spellCheck={false}
                />
            </div>

            {/* Output (Right Pane) */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                 {/* Tabs */}
                 <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'logs' 
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Console
                    </button>
                    <button
                        onClick={() => setActiveTab('graph')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'graph' 
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        Graph
                        {simulationResult && <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 rounded-full">New</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'results' 
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Table2 className="w-4 h-4" />
                        Data Table
                    </button>
                    <div className="flex-1" />
                    <button onClick={clearLogs} className="px-3 py-2 text-gray-500 hover:text-red-500 transition-colors" title="Clear All">
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-hidden relative">
                    
                    {/* LOGS TAB */}
                    <div className={`absolute inset-0 flex flex-col ${activeTab === 'logs' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                         <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-gray-900 text-gray-300">
                            {logs.map((log, i) => (
                                <div key={i} className={`${log.startsWith('ERR') ? 'text-red-400' : 'text-gray-300'} whitespace-pre-wrap`}>
                                    {log}
                                </div>
                            ))}
                            {logs.length === 0 && <span className="text-gray-600 italic">No logs...</span>}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* GRAPH TAB */}
                    <div className={`absolute inset-0 flex flex-col ${activeTab === 'graph' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                         {simulationResult ? (
                             <SimulationGraph data={simulationResult} />
                         ) : (
                             <div className="flex items-center justify-center h-full text-gray-400">
                                 No graph data available. Run a simulation first.
                             </div>
                         )}
                    </div>

                    {/* RESULTS TAB */}
                    <div className={`absolute inset-0 flex flex-col ${activeTab === 'results' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                         <SimulationResults data={simulationResult} />
                    </div>

                 </div>
            </div>
         </div>

         {/* Footer Controls */}
         <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <div className="text-xs text-gray-500 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isRunning ? 'Running Simulation...' : 'Ready'}
            </div>
            <div className="flex gap-2">
                {isRunning ? (
                     <button 
                        onClick={stopSimulation}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
                    >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Stop
                    </button>
                ) : (
                    <button 
                        onClick={runSimulation}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm font-medium shadow-sm hover:shadow"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Run Simulation
                    </button>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
