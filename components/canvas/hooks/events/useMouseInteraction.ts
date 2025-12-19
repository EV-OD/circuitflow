
import React, { useState, useEffect, useCallback } from 'react';
import { ToolType, XY } from '../../../../types';
import { useWiring } from '../../../../hooks/useWiring';
import { useMove } from '../../../../hooks/useMove';
import { usePan } from '../../../../hooks/usePan';
import { useWireDrag } from '../../../../hooks/useWireDrag';
import { useCircuit } from '../../../../context/CircuitContext';
import { GRID_SIZE, COMPONENT_LIBRARY } from '../../../../constants';
import { findAutoWirePath } from '../../../../services/auto-wiring';

interface UseMouseInteractionProps {
    svgRef: React.RefObject<SVGSVGElement>;
    screenToWorld: (x: number, y: number) => XY;
    getPortPosition: (compId: string, portId: string) => XY | null;
    findHitObject: (x: number, y: number) => { type: 'component' | 'node', id: string, subId?: string } | null;
    getSpiceNodeName: (id: string, subId: string) => string | null;
    getSpiceComponentName: (id: string) => string | null;
}

export const useMouseInteraction = ({
    svgRef,
    screenToWorld,
    getPortPosition,
    findHitObject,
    getSpiceNodeName,
    getSpiceComponentName
}: UseMouseInteractionProps) => {
    const { 
        activeTool, components, wires, viewport, setViewport, selectedComponentIds, selectComponent, 
        setSelection, updateComponents, addWire, updateWire, saveSnapshot, probingPaneId, probeMode,
        addVariableToActivePane, stopProbing, pendingComponent, addComponent,
        setDetailedProbeTarget, selectWire, customDefinitions
    } = useCircuit();

    const [mouseWorldPos, setMouseWorldPos] = useState<XY>({ x: 0, y: 0 });
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<XY | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<XY | null>(null);
    const [probeStartNode, setProbeStartNode] = useState<{ id: string, subId: string, x: number, y: number } | null>(null);
    const [probeCurrentPos, setProbeCurrentPos] = useState<{ x: number, y: number } | null>(null);
    const [hoveredObject, setHoveredObject] = useState<{ type: 'component' | 'node', id: string, subId?: string } | null>(null);
    const [autoWireStart, setAutoWireStart] = useState<{ componentId: string, portId: string } | null>(null);

    // Sub-hooks
    const { wiringStart, wirePoints, startWiring, addSegment, completeWiring, cancelWiring, getProjectedPoint } = useWiring(addWire, getPortPosition);
    const { startMove, updateMove, endMove, isMoving } = useMove(activeTool, components, selectedComponentIds, selectComponent, updateComponents, GRID_SIZE, saveSnapshot);
    const { isPanning, startPan, updatePan, endPan } = usePan(viewport, setViewport);
    
    // Wire Dragging Hook - Now passing getPortPosition
    const { 
        isDraggingWire, 
        hoveredWireSegment, 
        startWireDrag, 
        updateWireDrag, 
        endWireDrag, 
        updateHover,
        checkWireHit
    } = useWireDrag(wires, updateWire, screenToWorld, getPortPosition);

    // Reset states on tool change
    useEffect(() => {
        if (activeTool !== ToolType.WIRE) cancelWiring();
        if (activeTool !== ToolType.MOVE) { endMove(); setIsSelecting(false); endWireDrag(); }
        if (activeTool !== ToolType.PROBE) { 
            setProbeStartNode(null); 
            setProbeCurrentPos(null); 
            setHoveredObject(null);
        }
        if (activeTool !== ToolType.AUTO_WIRE) setAutoWireStart(null);
    }, [activeTool, cancelWiring, endMove, endWireDrag]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Logic Priority: Ghost -> Pan -> Wire Tool -> Probe -> Move/Select (Wire Drag -> Box -> Clear)
        const isBackground = e.target === svgRef.current || (e.target as Element).id === 'circuit-grid-background';
        const rect = svgRef.current!.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY);
        
        if (pendingComponent && e.button === 0) {
            const snappedX = Math.round(worldPos.x / GRID_SIZE) * GRID_SIZE;
            const snappedY = Math.round(worldPos.y / GRID_SIZE) * GRID_SIZE;
            addComponent(pendingComponent.type, snappedX, snappedY);
            return;
        }

        if (e.button === 1 || (activeTool === ToolType.PAN && e.button === 0)) {
           startPan(e);
           if (selectedComponentIds.length > 0) selectComponent('', false);
        } 
        else if (activeTool === ToolType.WIRE && isBackground && e.button === 0) {
            if (wiringStart) {
                const snapped = {
                    x: Math.round(worldPos.x / GRID_SIZE) * GRID_SIZE,
                    y: Math.round(worldPos.y / GRID_SIZE) * GRID_SIZE
                };
                addSegment(snapped);
            }
        }
        else if (activeTool === ToolType.AUTO_WIRE && e.button === 0) {
            const hit = findHitObject(worldPos.x, worldPos.y);
            if (hit && hit.type === 'node' && hit.subId) {
                if (!autoWireStart) {
                    setAutoWireStart({ componentId: hit.id, portId: hit.subId });
                } else {
                    // Second click - Perform Auto Wire
                    if (autoWireStart.componentId === hit.id && autoWireStart.portId === hit.subId) {
                        // Clicked same port - cancel
                        setAutoWireStart(null);
                        return;
                    }

                    const startPos = getPortPosition(autoWireStart.componentId, autoWireStart.portId);
                    const endPos = getPortPosition(hit.id, hit.subId);

                    if (startPos && endPos) {
                        const path = findAutoWirePath({
                            start: startPos,
                            end: endPos,
                            components,
                            definitions: [...COMPONENT_LIBRARY, ...customDefinitions],
                            existingWires: wires
                        });

                        if (path && path.length > 0) {
                            addWire({
                                sourceComponentId: autoWireStart.componentId,
                                sourcePortId: autoWireStart.portId,
                                destComponentId: hit.id,
                                destPortId: hit.subId,
                                points: path
                            });
                        }
                    }
                    setAutoWireStart(null);
                }
            } else {
                // Clicked empty space - cancel
                setAutoWireStart(null);
            }
        }
        else if (activeTool === ToolType.PROBE && e.button === 0) {
            // ... probe logic ...
            const hit = findHitObject(worldPos.x, worldPos.y);
            if (probingPaneId && probeMode) {
                if (probeMode === 'VOLTAGE') {
                    if (hit?.type === 'node' && hit.subId) {
                        setProbeStartNode({ id: hit.id, subId: hit.subId, x: worldPos.x, y: worldPos.y });
                        setProbeCurrentPos({ x: worldPos.x, y: worldPos.y });
                    }
                } else if (probeMode === 'CURRENT') {
                    if (hit?.type === 'component') {
                        const compName = getSpiceComponentName(hit.id);
                        if (compName) {
                            const isVoltageSource = compName.startsWith('V');
                            addVariableToActivePane(isVoltageSource ? `i(${compName})` : `@${compName}[i]`);
                            stopProbing();
                        }
                    }
                } else if (probeMode === 'COMPONENT_DETAILS') {
                    if (hit?.type === 'component') {
                        setDetailedProbeTarget({ componentId: hit.id, x: worldPos.x, y: worldPos.y });
                    }
                }
            }
        }
        else if (activeTool === ToolType.MOVE && e.button === 0) {
            // 1. Try Wire Drag first (highest precision priority)
            const hitWireId = startWireDrag(worldPos.x, worldPos.y, screenX, screenY);
            if (hitWireId) {
                selectWire(hitWireId);
                selectComponent('', false);
                return;
            }

            // 2. Selection Box logic implies background click
            if (isBackground) {
                if (!e.shiftKey) {
                    selectComponent('', false);
                    selectWire(null);
                }
                setSelectionStart(worldPos);
                setSelectionEnd(worldPos);
                setIsSelecting(true);
            }
        }
    }, [
        activeTool, pendingComponent, wiringStart, probingPaneId, probeMode, selectedComponentIds, 
        svgRef, screenToWorld, addComponent, startPan, selectComponent, addSegment, findHitObject, 
        getSpiceComponentName, addVariableToActivePane, stopProbing, setDetailedProbeTarget,
        startWireDrag, selectWire
    ]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = screenToWorld(screenX, screenY);
        setMouseWorldPos({ x: worldPos.x, y: worldPos.y });

        if (activeTool === ToolType.PROBE) {
            setHoveredObject(findHitObject(worldPos.x, worldPos.y));
            if (probeStartNode) setProbeCurrentPos(worldPos);
        }

        if (activeTool === ToolType.MOVE) {
            updateHover(worldPos.x, worldPos.y); 
        }

        if (isPanning) updatePan(e);
        if (isMoving && e.buttons === 1) updateMove(worldPos);
        if (isDraggingWire && e.buttons === 1) updateWireDrag(screenX, screenY);
        if (isSelecting) setSelectionEnd(worldPos);
    }, [
        activeTool, svgRef, screenToWorld, findHitObject, probeStartNode, isPanning, 
        updatePan, isMoving, updateMove, isSelecting, isDraggingWire, updateWireDrag, updateHover
    ]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        endPan();
        endMove();
        endWireDrag();
        
        if (activeTool === ToolType.PROBE && probingPaneId && probeMode === 'VOLTAGE' && probeStartNode) {
            const worldPos = screenToWorld(e.clientX - svgRef.current!.getBoundingClientRect().left, e.clientY - svgRef.current!.getBoundingClientRect().top);
            const hit = findHitObject(worldPos.x, worldPos.y);
            const node1 = getSpiceNodeName(probeStartNode.id, probeStartNode.subId);

            if (hit?.type === 'node' && hit.subId && (hit.id !== probeStartNode.id || hit.subId !== probeStartNode.subId)) {
                const node2 = getSpiceNodeName(hit.id, hit.subId);
                if (node1 && node2) addVariableToActivePane(`v(${node1},${node2})`);
            } else {
                if (node1) addVariableToActivePane(`v(${node1})`);
            }
            setProbeStartNode(null);
            setProbeCurrentPos(null);
            stopProbing();
        }

        if (isSelecting && selectionStart && selectionEnd) {
            const x = Math.min(selectionStart.x, selectionEnd.x);
            const y = Math.min(selectionStart.y, selectionEnd.y);
            const w = Math.abs(selectionStart.x - selectionEnd.x);
            const h = Math.abs(selectionStart.y - selectionEnd.y);

            if (w > 2 || h > 2) {
                 const hitIds = components.filter(c => {
                     const cx1 = c.x - 50; const cy1 = c.y - 50;
                     const cx2 = c.x + 50; const cy2 = c.y + 50;
                     return x < cx2 && (x + w) > cx1 && y < cy2 && (y + h) > cy1;
                 }).map(c => c.id);

                 if (hitIds.length > 0) {
                     if (e.shiftKey) {
                         const newSet = new Set([...selectedComponentIds, ...hitIds]);
                         setSelection(Array.from(newSet));
                     } else {
                         setSelection(hitIds);
                     }
                 }
            }
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionEnd(null);
        }
    }, [
        activeTool, probingPaneId, probeMode, probeStartNode, isSelecting, selectionStart, selectionEnd,
        endPan, endMove, endWireDrag, svgRef, screenToWorld, findHitObject, getSpiceNodeName, addVariableToActivePane, 
        stopProbing, components, selectedComponentIds, setSelection
    ]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        mouseWorldPos,
        probeStart: probeStartNode,
        probeEnd: probeCurrentPos,
        selectionStart,
        selectionEnd,
        wiringStart,
        wirePoints,
        startMove,
        startWiring,
        completeWiring,
        getProjectedPoint,
        isPanning,
        isMoving,
        isDraggingWire,
        hoveredObject,
        hoveredWireSegment,
        autoWireStart
    };
};
