
import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck, Play, ShieldAlert } from 'lucide-react';
import { ToolSelector } from './groups/ToolSelector';
import { ViewControls } from './groups/ViewControls';
import { FileControls } from './groups/FileControls';
import { SimulationControls } from './groups/SimulationControls';
import { useCircuit } from '../../context/CircuitContext';

interface ToolbarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const [saveName, setSaveName] = useState('MyCircuit');
  const { isAutoCheckEnabled, setIsAutoCheckEnabled, runManualCheck, currentIssues } = useCircuit();

  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shadow-sm z-20 relative transition-colors">
      
      {/* Left Section: Sidebar Toggle & Tools */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

        <ToolSelector />
        
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
        
        <ViewControls />
        
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

        {/* Design Check Controls - Minimalist */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 space-x-1">
            <button
                onClick={() => setIsAutoCheckEnabled(!isAutoCheckEnabled)}
                className={`p-2 rounded-md transition-all flex items-center justify-center ${
                    isAutoCheckEnabled 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
                }`}
                title={`Auto Check: ${isAutoCheckEnabled ? 'ON' : 'OFF'}`}
            >
                {isAutoCheckEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </button>
            
            {!isAutoCheckEnabled && (
                <button
                    onClick={runManualCheck}
                    className="p-2 rounded-md text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                    title="Run Check Now"
                >
                    <Play className="w-4 h-4 fill-current" />
                </button>
            )}

            {currentIssues.length > 0 && (
                <div className="px-2 flex items-center">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Right Section: Simulation & Files */}
      <div className="flex items-center space-x-3">
         <SimulationControls saveName={saveName} />
         
         <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
         
         <FileControls saveName={saveName} setSaveName={setSaveName} />
      </div>
    </div>
  );
};
