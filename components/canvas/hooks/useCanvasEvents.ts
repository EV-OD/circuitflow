
import React from 'react';
import { useCircuit } from '../../../context/CircuitContext';
import { useCoordinateSystem } from './utils/useCoordinateSystem';
import { useHitTest } from './utils/useHitTest';
import { useDragDrop } from './events/useDragDrop';
import { useMouseInteraction } from './events/useMouseInteraction';

export const useCanvasEvents = (svgRef: React.RefObject<SVGSVGElement>) => {
  const { 
    components, 
    viewport, 
    addComponent,
    lastNetlistResult,
    customDefinitions
  } = useCircuit();

  // 1. Coordinate System
  const { screenToWorld } = useCoordinateSystem(viewport);

  // 2. Hit Testing
  const { 
      findHitObject, 
      getPortPosition, 
      getSpiceNodeName, 
      getSpiceComponentName 
  } = useHitTest({ components, customDefinitions, lastNetlistResult });

  // 3. Drag & Drop (Sidebar to Canvas)
  const { handleDragOver, handleDrop } = useDragDrop({ svgRef, screenToWorld, addComponent });

  // 4. Mouse Interactions (Select, Wire, Probe, Pan)
  const interaction = useMouseInteraction({
      svgRef,
      screenToWorld,
      getPortPosition,
      findHitObject,
      getSpiceNodeName,
      getSpiceComponentName
  });

  return {
      // Event Handlers
      handleMouseDown: interaction.handleMouseDown,
      handleMouseMove: interaction.handleMouseMove,
      handleMouseUp: interaction.handleMouseUp,
      handleDragOver,
      handleDrop,
      
      // State & Data
      mouseWorldPos: interaction.mouseWorldPos,
      probeStart: interaction.probeStart,
      probeEnd: interaction.probeEnd,
      selectionStart: interaction.selectionStart,
      selectionEnd: interaction.selectionEnd,
      wiringStart: interaction.wiringStart,
      wirePoints: interaction.wirePoints,
      hoveredObject: interaction.hoveredObject,
      hoveredWireSegment: interaction.hoveredWireSegment,
      autoWireStart: interaction.autoWireStart,
      isPanning: interaction.isPanning,
      isMoving: interaction.isMoving,
      isDraggingWire: interaction.isDraggingWire,
      
      // Helpers / Actions
      startMove: interaction.startMove,
      startWiring: interaction.startWiring,
      completeWiring: interaction.completeWiring,
      getProjectedPoint: interaction.getProjectedPoint,
      getPortPosition,
      screenToWorld
  };
};
