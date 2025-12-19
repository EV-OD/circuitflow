
import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { COMPONENT_LIBRARY } from '../../constants';
import { ComponentCategory } from '../../types';

interface QuickAddCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddCommand: React.FC<QuickAddCommandProps> = ({ isOpen, onClose }) => {
  const { setPendingComponent, customDefinitions } = useCircuit();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine and sort: Basic components first, then others
  const allComponents = [...COMPONENT_LIBRARY, ...customDefinitions].sort((a, b) => {
      // Prioritize PRIMARY category
      if (a.category === ComponentCategory.PRIMARY && b.category !== ComponentCategory.PRIMARY) return -1;
      if (a.category !== ComponentCategory.PRIMARY && b.category === ComponentCategory.PRIMARY) return 1;
      return a.label.localeCompare(b.label);
  });

  const filtered = allComponents.filter(c => 
    c.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setSearchTerm('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (index: number) => {
      const comp = filtered[index];
      if (comp) {
          setPendingComponent({ type: comp.type });
          onClose();
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm" onMouseDown={onClose}>
        <div 
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Search components (Basic, Real World)..."
                    className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleKeyDown}
                />
                <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">ESC to close</div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2">
                {filtered.map((comp, i) => (
                    <button
                        key={comp.type}
                        onClick={() => handleSelect(i)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group transition-colors ${
                            i === selectedIndex 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${i === selectedIndex ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">{comp.label}</div>
                                <div className={`text-xs ${i === selectedIndex ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {comp.category === ComponentCategory.PRIMARY ? 'Basic' : 'Real World'}
                                </div>
                            </div>
                        </div>
                        {i === selectedIndex && (
                            <span className="text-xs text-white/70 font-medium">Enter to add</span>
                        )}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No components found.</div>
                )}
            </div>
        </div>
    </div>
  );
};
