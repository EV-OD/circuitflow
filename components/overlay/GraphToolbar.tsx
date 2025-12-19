
import React from 'react';
import { ListFilter, Plus, Zap, Activity } from 'lucide-react';

interface GraphToolbarProps {
    onProbeVoltageClick: () => void;
    onProbeCurrentClick: () => void;
    onVariablesClick: () => void;
    isProbingVoltage: boolean;
    isProbingCurrent: boolean;
    isVariableSelectorOpen: boolean;
    xAxisLabel: string;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({ 
    onProbeVoltageClick,
    onProbeCurrentClick, 
    onVariablesClick,
    isProbingVoltage,
    isProbingCurrent,
    isVariableSelectorOpen,
    xAxisLabel
}) => {
  return (
      <div className="absolute top-2 left-10 z-10 flex gap-4 transition-opacity bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
        
        {/* X Axis */}
        <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">X-Axis</span>
            <div className="text-xs font-mono font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                {xAxisLabel}
            </div>
        </div>

        {/* Y Axis Controls */}
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Y-Axis</span>
            
            <button 
                onClick={onProbeVoltageClick}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                    isProbingVoltage
                    ? 'bg-blue-600 text-white shadow-inner' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="Measure Voltage (Click node or Drag between nodes)"
            >
                <Activity className="w-3.5 h-3.5" />
                <span>+ Voltage</span>
            </button>

            <button 
                onClick={onProbeCurrentClick}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                    isProbingCurrent
                    ? 'bg-amber-600 text-white shadow-inner' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
                title="Measure Current (Click component)"
            >
                <Zap className="w-3.5 h-3.5" />
                <span>+ Current</span>
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

            <button 
                onClick={onVariablesClick}
                className={`p-1.5 rounded transition-all ${
                    isVariableSelectorOpen
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Select Variables List"
            >
                <ListFilter className="w-4 h-4" />
            </button>
        </div>
      </div>
  );
};
