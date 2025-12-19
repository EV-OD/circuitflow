
import React from 'react';
import { X, RotateCw, Trash2 } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { COMPONENT_LIBRARY } from '../../constants';

export const PropertyPanel: React.FC = () => {
  const { 
    selectedComponentIds, 
    components, 
    updateComponent, 
    setSelection,
    removeSelection,
    rotateSelected,
    saveSnapshot,
    customDefinitions
  } = useCircuit();

  // Only show if exactly one component is selected
  if (selectedComponentIds.length !== 1) return null;

  const component = components.find(c => c.id === selectedComponentIds[0]);
  if (!component) return null;

  const def = COMPONENT_LIBRARY.find(c => c.type === component.definitionType) || 
              customDefinitions.find(c => c.type === component.definitionType);
              
  if (!def) return null;

  const handlePropChange = (key: string, value: string) => {
     updateComponent(component.id, {
         properties: { ...component.properties, [key]: value }
     });
  };

  const handleDelete = () => {
      removeSelection(); // This deletes
  };

  const handleClose = () => {
      setSelection([]); // This just deselects
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full flex flex-col shadow-xl transition-colors z-20">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                Properties
            </h2>
            <button 
                type="button"
                onClick={handleClose} 
                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-3 pb-2">
                 <div className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800/30">
                     {def.symbol.charAt(0).toUpperCase()}
                 </div>
                 <div>
                     <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{def.label}</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{component.definitionType}</div>
                 </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Transform Controls */}
             <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Transform</h3>
                    <button 
                        type="button"
                        onClick={rotateSelected}
                        className="p-1.5 text-xs flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                        title="Rotate 90° (R)"
                    >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Rotate 90°</span>
                    </button>
                </div>
                
                <div className="space-y-1">
                     <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Rotation</label>
                     <input 
                        type="text" 
                        readOnly
                        value={`${component.rotation}°`}
                        className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400 cursor-not-allowed focus:outline-none"
                     />
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Component Parameters */}
            <div>
                 <h3 className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mb-3 tracking-wider">Parameters</h3>
                 <div className="space-y-4">
                    {Object.entries(component.properties).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                             <label className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize flex justify-between">
                                {key}
                                {/* Optional: Add units hint based on key */}
                                {['resistance'].includes(key) && <span className="opacity-50 font-normal">Ω</span>}
                                {['capacitance'].includes(key) && <span className="opacity-50 font-normal">F</span>}
                                {['voltage'].includes(key) && <span className="opacity-50 font-normal">V</span>}
                             </label>
                             <input 
                                type="text"
                                value={val}
                                onFocus={saveSnapshot}
                                onChange={(e) => handlePropChange(key, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-700 dark:text-gray-300 font-mono transition-all"
                                placeholder={`Enter ${key}...`}
                             />
                        </div>
                    ))}
                    {Object.keys(component.properties).length === 0 && (
                        <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                            No editable parameters.
                        </div>
                    )}
                 </div>
            </div>
            
             {/* Pinout Display (For Custom Components) */}
            {def.symbol === 'generic' && (
                <div className="mt-4">
                     <h3 className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mb-3 tracking-wider">Pinout</h3>
                     <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {def.ports.map(p => (
                            <div key={p.id} className="text-xs flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">{p.id}</span>
                            </div>
                        ))}
                     </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <button 
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium border border-red-200 dark:border-red-800/30"
            >
                <Trash2 className="w-4 h-4" />
                Delete Component
            </button>
        </div>
    </div>
  );
};
