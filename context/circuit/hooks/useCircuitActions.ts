
import React, { useCallback, useRef, useEffect } from 'react';
import { CircuitComponent, Wire, ComponentDefinition, ToolType, VirtualGrid, CircuitReport } from '../../../types';
import { COMPONENT_LIBRARY } from '../../../constants';
import { supabaseService } from '../../../services/supabaseService';
import { generateDesignator } from '../../../services/unique-naming/generator';
import { ActionDeps } from '../circuitTypes';
import { findAutoWirePath } from '../../../services/auto-wiring';
import { calculatePortPosition, getPortDirection } from '../../../services/circuitUtils';

export const useCircuitActions = (deps: ActionDeps) => {
    const { 
        components, setComponents, wires, setWires, grids, setGrids,
        reports, setReports,
        selectedComponentIds, setSelectedComponentIds, 
        selectedWireId, setSelectedWireId,
        saveSnapshot, customDefinitions, setCustomDefinitions, setPendingComponent, setActiveTool,
        stopProbing
    } = deps;

    // Ref to track the LATEST components list, allowing synchronous updates within the same event loop/batch
    const componentsRef = useRef(components);
    
    // Sync ref when React state updates
    useEffect(() => {
        componentsRef.current = components;
    }, [components]);

    const setActiveToolWrapper = useCallback((tool: ToolType) => {
        setActiveTool(tool);
        if (tool !== ToolType.MOVE) setPendingComponent(null);
        if (tool !== ToolType.PROBE) {
            stopProbing();
        }
        if (tool === ToolType.WIRE || tool === ToolType.PROBE) {
            setSelectedComponentIds([]);
        }
    }, [setActiveTool, setPendingComponent, stopProbing, setSelectedComponentIds]);

    const addComponent = useCallback((type: string, x: number, y: number): CircuitComponent | null => {
        saveSnapshot(); 
        const allDefs = [...COMPONENT_LIBRARY, ...customDefinitions];
        const def = allDefs.find(c => c.type === type);
        
        if (!def) return null;
        
        const id = crypto.randomUUID();
        // Use ref to generate designator to avoid duplicates in batch
        const designator = generateDesignator(type, componentsRef.current, allDefs);

        const newComponent: CircuitComponent = {
          id,
          designator,
          definitionType: type,
          x, y, rotation: 0,
          properties: { ...def.defaultProperties }
        };
        
        // Update both ref (immediate) and state (async)
        componentsRef.current = [...componentsRef.current, newComponent];
        setComponents(prev => [...prev, newComponent]);
        
        return newComponent;
    }, [saveSnapshot, customDefinitions, setComponents]);

    const addGrid = useCallback((grid: VirtualGrid) => {
        setGrids(prev => [...prev, grid]);
    }, [setGrids]);

    const removeGrid = useCallback((id: string) => {
        setGrids(prev => prev.filter(g => g.id !== id));
    }, [setGrids]);

    const registerComponent = useCallback((def: ComponentDefinition) => {
        setCustomDefinitions(prev => {
            if (prev.some(c => c.type === def.type)) return prev;
            
            supabaseService.shareComponent(def).then(success => {
                if (success) console.log("Component shared to cloud:", def.label);
            });
            return [...prev, def];
        });
    }, [setCustomDefinitions]);

    const updateComponent = useCallback((id: string, updates: Partial<CircuitComponent>) => {
        setComponents(prev => {
            const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
            componentsRef.current = next; // Sync Ref
            return next;
        });
    }, [setComponents]);

    const updateComponents = useCallback((updates: { id: string, updates: Partial<CircuitComponent> }[]) => {
        setComponents(prev => {
            const updateMap = new Map(updates.map(u => [u.id, u.updates]));
            const next = prev.map(c => {
                const up = updateMap.get(c.id);
                return up ? { ...c, ...up } : c;
            });
            componentsRef.current = next; // Sync Ref
            return next;
        });
    }, [setComponents]);

    const deleteComponent = useCallback((id: string) => {
        saveSnapshot();
        setComponents(prev => {
            const next = prev.filter(c => c.id !== id);
            componentsRef.current = next; // Sync Ref
            return next;
        });
        setWires(prev => prev.filter(w => w.sourceComponentId !== id && w.destComponentId !== id));
        setSelectedComponentIds(prev => prev.filter(pid => pid !== id));
    }, [saveSnapshot, setComponents, setWires, setSelectedComponentIds]);

    const deleteWire = useCallback((id: string) => {
        saveSnapshot();
        setWires(prev => prev.filter(w => w.id !== id));
    }, [saveSnapshot, setWires]);

    const selectComponent = useCallback((id: string, multi: boolean) => {
        if (multi) {
            setSelectedComponentIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        } else {
            setSelectedComponentIds(id ? [id] : []);
        }
    }, [setSelectedComponentIds]);

    const setSelection = useCallback((ids: string[]) => setSelectedComponentIds(ids), [setSelectedComponentIds]);

    const removeSelection = useCallback(() => {
        if (selectedComponentIds.length === 0) return;
        saveSnapshot();
        setComponents(prev => {
            const next = prev.filter(c => !selectedComponentIds.includes(c.id));
            componentsRef.current = next; // Sync Ref
            return next;
        });
        setWires(prev => prev.filter(w => 
            !selectedComponentIds.includes(w.sourceComponentId) && 
            !selectedComponentIds.includes(w.destComponentId)
        ));
        setSelectedComponentIds([]);
    }, [selectedComponentIds, saveSnapshot, setComponents, setWires, setSelectedComponentIds]);

    const addWire = useCallback((wireData: Omit<Wire, 'id'>) => {
        setWires(prev => {
            const exists = prev.some(w => 
                (w.sourceComponentId === wireData.sourceComponentId && w.sourcePortId === wireData.sourcePortId &&
                 w.destComponentId === wireData.destComponentId && w.destPortId === wireData.destPortId) ||
                (w.sourceComponentId === wireData.destComponentId && w.sourcePortId === wireData.destPortId &&
                 w.destComponentId === wireData.sourceComponentId && w.destPortId === wireData.sourcePortId) 
            );
            if (exists) return prev;
            return [...prev, { id: crypto.randomUUID(), ...wireData }];
        });
        saveSnapshot();
    }, [saveSnapshot, setWires]);

    const rotateSelected = useCallback(() => {
        if (selectedComponentIds.length === 0) return;
        saveSnapshot();
        setComponents(prev => {
            const next = prev.map(c => selectedComponentIds.includes(c.id) ? { ...c, rotation: (c.rotation + 90) % 360 } : c);
            componentsRef.current = next;
            return next;
        });
    }, [selectedComponentIds, saveSnapshot, setComponents]);

    const selectWire = useCallback((id: string | null) => {
        setSelectedWireId(id);
    }, [setSelectedWireId]);

    const updateWire = useCallback((id: string, points: { x: number, y: number }[]) => {
        setWires(prev => prev.map(w => w.id === id ? { ...w, points } : w));
        saveSnapshot();
    }, [setWires, saveSnapshot]);

    const redesignCircuit = useCallback(() => {
        const allDefs = [...COMPONENT_LIBRARY, ...customDefinitions];
        const currentComponents = componentsRef.current;

        setWires(currentWires => {
            // Process sequentially to allow wires to avoid each other
            const newWires: Wire[] = [];
            
            for (const wire of currentWires) {
                const sourceComp = currentComponents.find(c => c.id === wire.sourceComponentId);
                const destComp = currentComponents.find(c => c.id === wire.destComponentId);

                // If endpoints are missing, keep wire as is (safe fallback)
                if (!sourceComp || !destComp) {
                    newWires.push(wire);
                    continue;
                }

                const start = calculatePortPosition(sourceComp, wire.sourcePortId, allDefs);
                const end = calculatePortPosition(destComp, wire.destPortId, allDefs);

                if (!start || !end) {
                    newWires.push(wire);
                    continue;
                }

                const startDirection = getPortDirection(sourceComp, wire.sourcePortId, allDefs);
                const endDirection = getPortDirection(destComp, wire.destPortId, allDefs);

                // Use the wires we have ALREADY re-routed as obstacles to prevent overlaps
                const points = findAutoWirePath({
                    start,
                    end,
                    startDirection,
                    endDirection,
                    components: currentComponents,
                    definitions: allDefs,
                    existingWires: newWires // Pass already processed wires as obstacles
                });

                newWires.push({ ...wire, points });
            }
            return newWires;
        });
        saveSnapshot();
    }, [customDefinitions, setWires, saveSnapshot]);

    // Report Actions
    const addReport = useCallback((report: CircuitReport) => {
        setReports(prev => [report, ...prev]);
    }, [setReports]);

    const deleteReport = useCallback((id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
    }, [setReports]);

    return {
        addComponent, registerComponent, updateComponent, updateComponents, deleteComponent,
        deleteWire, selectComponent, setSelection, removeSelection, addWire, rotateSelected,
        addGrid, removeGrid, addReport, deleteReport,
        selectWire, updateWire, redesignCircuit,
        setActiveTool: setActiveToolWrapper
    };
};
