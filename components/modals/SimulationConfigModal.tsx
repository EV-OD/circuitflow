
import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Activity, Settings2, Save } from 'lucide-react';
import { SimulationConfig } from '../../types';
import { useCircuit } from '../../context/CircuitContext';

interface SimulationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (config: SimulationConfig) => void;
}

const DEFAULT_CONFIG: SimulationConfig = {
  type: 'TRAN',
  transient: {
    stopTime: '10ms',
    stepTime: '10us',
    startTime: '0'
  },
  dc: {
    source: 'V1',
    start: '0',
    stop: '5',
    increment: '0.1'
  }
};

export const SimulationConfigModal: React.FC<SimulationConfigModalProps> = ({ isOpen, onClose, onRun }) => {
  const { simulationConfig, updateSimulationConfig } = useCircuit();
  const [config, setConfig] = useState<SimulationConfig>(simulationConfig || DEFAULT_CONFIG);

  // When modal opens, or context config changes, update local state
  useEffect(() => {
    if (simulationConfig) {
        setConfig(simulationConfig);
    }
  }, [simulationConfig, isOpen]);

  if (!isOpen) return null;

  const handleRun = () => {
    // Save to context/local storage automatically on Run
    updateSimulationConfig(config);
    onRun(config);
    onClose();
  };
  
  const handleSaveOnly = () => {
      updateSimulationConfig(config);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            Run Configuration
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Analysis Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Type</label>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                  onClick={() => setConfig({ ...config, type: 'TRAN' })}
                  className={`py-2 text-sm rounded-md font-medium transition-all ${config.type === 'TRAN' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  Transient
                </button>
                <button 
                  onClick={() => setConfig({ ...config, type: 'DC' })}
                  className={`py-2 text-sm rounded-md font-medium transition-all ${config.type === 'DC' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  DC Sweep
                </button>
                <button 
                  onClick={() => setConfig({ ...config, type: 'OP' })}
                  className={`py-2 text-sm rounded-md font-medium transition-all ${config.type === 'OP' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  Op. Point
                </button>
            </div>
          </div>

          {/* Parameters Form */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800 min-h-[160px]">
             {config.type === 'TRAN' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                     <Clock className="w-4 h-4" />
                     <span className="text-sm font-semibold">Time Domain Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Stop Time</label>
                        <input 
                           type="text" 
                           value={config.transient.stopTime}
                           onChange={(e) => setConfig({ ...config, transient: { ...config.transient, stopTime: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                           placeholder="e.g. 10ms"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Step Size</label>
                        <input 
                           type="text" 
                           value={config.transient.stepTime}
                           onChange={(e) => setConfig({ ...config, transient: { ...config.transient, stepTime: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                           placeholder="e.g. 10us"
                        />
                     </div>
                     <div className="space-y-1 col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">Start Saving Data After</label>
                        <input 
                           type="text" 
                           value={config.transient.startTime}
                           onChange={(e) => setConfig({ ...config, transient: { ...config.transient, startTime: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                           placeholder="e.g. 0"
                        />
                     </div>
                  </div>
               </div>
             )}

             {config.type === 'DC' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm font-semibold">DC Sweep Analysis</span>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase">Source Name</label>
                      <input 
                          type="text" 
                          value={config.dc.source}
                          onChange={(e) => setConfig({ ...config, dc: { ...config.dc, source: e.target.value } })}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                          placeholder="e.g. V1"
                      />
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Start</label>
                        <input 
                           type="text" 
                           value={config.dc.start}
                           onChange={(e) => setConfig({ ...config, dc: { ...config.dc, start: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Stop</label>
                        <input 
                           type="text" 
                           value={config.dc.stop}
                           onChange={(e) => setConfig({ ...config, dc: { ...config.dc, stop: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Incr.</label>
                        <input 
                           type="text" 
                           value={config.dc.increment}
                           onChange={(e) => setConfig({ ...config, dc: { ...config.dc, increment: e.target.value } })}
                           className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono dark:text-white"
                        />
                      </div>
                   </div>
                </div>
             )}
             
             {config.type === 'OP' && (
                 <div className="text-sm text-gray-500 dark:text-gray-400 italic py-10 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    Calculates the DC operating point of the circuit. <br/>No additional parameters required.
                 </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
          <button 
             onClick={handleSaveOnly}
             className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors flex items-center gap-2"
          >
             <Save className="w-4 h-4" />
             Save Settings
          </button>
          <button 
             onClick={handleRun}
             className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-sm hover:shadow text-sm font-bold"
          >
             <Play className="w-4 h-4 fill-current" />
             Run Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
