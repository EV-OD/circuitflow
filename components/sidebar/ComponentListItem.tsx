import React from 'react';
import { ComponentDefinition } from '../../types';
import { SymbolShape } from '../canvas/SymbolShape';

interface ComponentListItemProps {
  comp: ComponentDefinition;
  onAdd: () => void;
  viewMode?: 'grid' | 'list';
}

export const ComponentListItem: React.FC<ComponentListItemProps> = ({ comp, onAdd, viewMode = 'grid' }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('circuit/component-type', comp.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (viewMode === 'list') {
    return (
      <button
        onClick={onAdd}
        draggable={true}
        onDragStart={handleDragStart}
        className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing"
      >
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pointer-events-none">
          <svg viewBox="-50 -50 100 100" className="w-8 h-8 pointer-events-none">
            <SymbolShape symbol={comp.symbol} className="stroke-current" />
          </svg>
        </div>
        <div className="ml-3 text-left pointer-events-none">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{comp.label}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
            {comp.defaultProperties.model || 'Generic Model'}
          </div>
        </div>
      </button>
    );
  }

  // Default Grid View
  return (
    <button
      onClick={onAdd}
      draggable={true}
      onDragStart={handleDragStart}
      className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing aspect-square"
    >
      <div className="flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pointer-events-none mb-2">
        <svg viewBox="-50 -50 100 100" className="w-12 h-12 overflow-visible">
          <SymbolShape symbol={comp.symbol} className="stroke-current" />
        </svg>
      </div>
      
      <div className="text-center pointer-events-none">
        <span className="block text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
          {comp.label}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block">
             {Object.values(comp.defaultProperties)[0]}
        </span>
      </div>
    </button>
  );
};