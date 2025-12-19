
import React, { useState, useEffect } from 'react';
import { Layout, ChevronsRight } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { GraphPane } from './GraphPane';
import { GraphLayout } from '../../types';

export const SimulationOverlay: React.FC = () => {
  const { setIsSimOverlayOpen, graphLayout } = useCircuit();
  
  // Initialize from localStorage or default
  const [width, setWidth] = useState(() => {
      const saved = localStorage.getItem('circuitflow_sim_width');
      return saved ? parseInt(saved, 10) : 500;
  });
  
  const [isResizing, setIsResizing] = useState(false);

  // Persist width updates
  useEffect(() => {
      localStorage.setItem('circuitflow_sim_width', width.toString());
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Find the canvas container to calculate width relative to it
        const container = document.getElementById('canvas-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            // Width is distance from right edge of container
            const newWidth = rect.right - e.clientX;
            // Clamp width (min 300px, max container width - 50px buffer)
            setWidth(Math.max(300, Math.min(newWidth, rect.width - 50)));
        } else {
             // Fallback to window width
             setWidth(Math.max(300, window.innerWidth - e.clientX));
        }
      }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  const renderLayout = (node: GraphLayout): React.ReactNode => {
      if (node.type === 'pane' && node.paneId) {
          return <GraphPane key={node.id} paneId={node.paneId} />;
      }
      if ((node.type === 'row' || node.type === 'col') && node.children) {
          return (
              <div className={`flex flex-1 ${node.type === 'row' ? 'flex-col' : 'flex-row'} h-full w-full overflow-hidden`}>
                  {node.children.map((child, i) => (
                      <React.Fragment key={child.id}>
                          <div style={{ flex: child.size || 1 }} className="relative overflow-hidden">
                             {renderLayout(child)}
                          </div>
                          {i < node.children!.length - 1 && (
                              <div className={`bg-gray-200 dark:bg-gray-700 ${node.type === 'row' ? 'h-1' : 'w-1'}`} />
                          )}
                      </React.Fragment>
                  ))}
              </div>
          );
      }
      return null;
  };

  return (
    <div 
        className="absolute top-0 right-0 bottom-0 z-40 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col transition-all duration-75"
        style={{ width }}
    >
      {/* Resize Handle (Left Border) */}
      <div 
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:w-1.5 transition-all z-50 group flex items-center justify-center -ml-0.5"
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
      >
          {/* Visual Grip Indicator */}
          <div className="h-8 w-1 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Header Bar */}
      <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 shrink-0 select-none">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
             <Layout className="w-4 h-4" />
             Simulation Results
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsSimOverlayOpen(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                title="Collapse Panel"
            >
                <ChevronsRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative p-1 bg-gray-100 dark:bg-gray-950">
           {renderLayout(graphLayout)}
      </div>
    </div>
  );
};
