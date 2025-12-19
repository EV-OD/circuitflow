
import React, { useRef } from 'react';
import { Save, FolderOpen, HardDrive, History } from 'lucide-react';
import { useCircuit } from '../../../context/CircuitContext';

interface FileControlsProps {
    saveName: string;
    setSaveName: (name: string) => void;
}

export const FileControls: React.FC<FileControlsProps> = ({ saveName, setSaveName }) => {
  const { saveCircuit, loadCircuit, downloadCircuit, uploadCircuit } = useCircuit();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCircuit(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-gray-50 dark:bg-gray-800">
        <input 
            type="text" 
            value={saveName} 
            onChange={(e) => setSaveName(e.target.value)}
            className="text-sm px-3 py-1 outline-none text-left w-32 lg:w-40 bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 font-medium"
            placeholder="Circuit Name"
        />
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* Main File Controls (Save to Device / Load from Device) */}
        <button onClick={() => downloadCircuit(saveName)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Save to Device (File)">
            <Save className="w-4 h-4" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Load from Device (File)">
            <FolderOpen className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        
        {/* Browser Storage Controls (Quick Save/Load) */}
        <button onClick={() => saveCircuit(saveName)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-500 hover:text-blue-500" title="Quick Save (Browser Storage)">
            <HardDrive className="w-4 h-4" />
        </button>
        <button onClick={() => loadCircuit(saveName)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-500 hover:text-blue-500" title="Quick Load (Browser Storage)">
            <History className="w-4 h-4" />
        </button>

        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
    </div>
  );
};
