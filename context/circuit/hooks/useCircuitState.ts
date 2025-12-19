
import { useState, useEffect, useCallback } from 'react';
import { CircuitComponent, Wire, ViewportTransform, ToolType, ComponentDefinition, VirtualGrid, CircuitReport } from '../../../types';
import { COMPONENT_LIBRARY, ZOOM_MIN, ZOOM_MAX } from '../../../constants';
import { supabaseService } from '../../../services/supabaseService';
import { useHistory } from '../../../hooks/useHistory';

export const useCircuitState = () => {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [grids, setGrids] = useState<VirtualGrid[]>([]);
  const [reports, setReports] = useState<CircuitReport[]>([]); // New
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.MOVE);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false); 
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  
  // Ghost Mode
  const [pendingComponent, setPendingComponent] = useState<{ type: string } | null>(null);

  // Library
  const [customDefinitions, setCustomDefinitions] = useState<ComponentDefinition[]>([]);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('circuitflow_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // History Integration
  const { undo, redo, saveSnapshot, clearHistory, canUndo, canRedo } = useHistory({
    components, setComponents, wires, setWires, setSelectedComponentIds
  });

  // Initialization
  useEffect(() => {
    const loadSharedComponents = async () => {
        const shared = await supabaseService.fetchSharedComponents();
        if (shared.length > 0) {
            setCustomDefinitions(prev => {
                const existingTypes = new Set(prev.map(c => c.type));
                const uniqueShared = shared.filter(c => !existingTypes.has(c.type));
                return [...prev, ...uniqueShared];
            });
        }
    };
    loadSharedComponents();
  }, []);

  const toggleTheme = useCallback(() => {
      setIsDarkMode(prev => {
          const newVal = !prev;
          localStorage.setItem('circuitflow_theme', newVal ? 'dark' : 'light');
          return newVal;
      });
  }, []);

  const zoomIn = useCallback(() => {
    setViewport(prev => ({ ...prev, k: Math.min(ZOOM_MAX, prev.k * 1.2) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({ ...prev, k: Math.max(ZOOM_MIN, prev.k / 1.2) }));
  }, []);

  return {
    components, setComponents,
    wires, setWires,
    grids, setGrids,
    reports, setReports,
    selectedComponentIds, setSelectedComponentIds,
    selectedWireId, setSelectedWireId,
    activeTool, setActiveTool,
    viewport, setViewport,
    isDragging, setIsDragging,
    isLoading, setIsLoading,
    isQuickAddOpen, setIsQuickAddOpen,
    isLabOpen, setIsLabOpen,
    showBoundingBoxes, setShowBoundingBoxes,
    isDarkMode, toggleTheme,
    pendingComponent, setPendingComponent,
    customDefinitions, setCustomDefinitions,
    undo, redo, saveSnapshot, clearHistory, canUndo, canRedo,
    zoomIn, zoomOut
  };
};
