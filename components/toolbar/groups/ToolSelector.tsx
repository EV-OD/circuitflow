
import React from 'react';
import { 
  MousePointer2, 
  Hand, 
  Zap, 
  Wand2,
  Trash2, 
  Activity,
  Plus
} from 'lucide-react';
import { useCircuit } from '../../../context/CircuitContext';
import { ToolType } from '../../../types';

export const ToolSelector: React.FC = () => {
  const { activeTool, setActiveTool, selectedComponentIds, removeSelection, setIsQuickAddOpen } = useCircuit();

  const tools = [
    { id: ToolType.MOVE, icon: MousePointer2, label: 'Move / Select (V, M)' },
    { id: ToolType.PAN, icon: Hand, label: 'Pan (H)' },
    { id: ToolType.WIRE, icon: Zap, label: 'Wire (W)' },
    { id: ToolType.AUTO_WIRE, icon: Wand2, label: 'Auto Wire' },
    { id: ToolType.PROBE, icon: Activity, label: 'Probe (P)' },
    { 
      id: ToolType.DELETE, 
      icon: Trash2, 
      label: 'Delete (X)', 
      action: () => {
        if (selectedComponentIds.length > 0) {
          removeSelection();
        } else {
          setActiveTool(ToolType.DELETE);
        }
      } 
    },
  ];

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 space-x-1 transition-colors">
        <button
            onClick={() => setIsQuickAddOpen(true)}
            className="p-2 rounded-md transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
            title="Add Component (Shift+A)"
        >
            <Plus className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1"></div>

        {tools.map(tool => (
        <button
            key={tool.id}
            onClick={() => {
                if (tool.action) tool.action();
                else setActiveTool(tool.id);
            }}
            className={`p-2 rounded-md transition-all ${
            activeTool === tool.id 
                ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={tool.label}
        >
            <tool.icon className="w-5 h-5" />
        </button>
        ))}
    </div>
  );
};
