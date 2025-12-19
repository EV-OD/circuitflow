
import React, { useRef, useImperativeHandle } from 'react';
import { useCircuit } from '../../context/CircuitContext';
import { GRID_SIZE, COMPONENT_LIBRARY } from '../../constants';
import { ToolType } from '../../types';
import { WiringOverlay } from './WiringOverlay';
import { SimulationOverlay } from '../overlay/SimulationOverlay';
import { useCanvasEvents } from './hooks/useCanvasEvents';

// Layers
import { GridLayer } from './layers/GridLayer';
import { WireLayer } from './layers/WireLayer';
import { ComponentLayer } from './layers/ComponentLayer';
import { SelectionOverlay } from './layers/SelectionOverlay';
import { ProbeHighlightLayer } from './layers/ProbeHighlightLayer';
import { GridGuideLayer } from './layers/GridGuideLayer';
import { BoundingBoxLayer } from './layers/BoundingBoxLayer';
import { SymbolShape } from './SymbolShape';
import { ComponentProbeMenu } from './ComponentProbeMenu';

export const Canvas: React.FC = () => {
  const { 
    components, 
    wires, 
    grids,
    viewport, 
    activeTool, 
    selectedComponentIds,
    selectComponent,
    isDarkMode,
    isSimOverlayOpen,
    probeMode,
    detailedProbeTarget,
    setDetailedProbeTarget,
    addVariableToActivePane,
    stopProbing,
    pendingComponent,
    customDefinitions,
    canvasRef: contextCanvasRef,
    showBoundingBoxes
  } = useCircuit();
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Sync the local ref to the context ref
  useImperativeHandle(contextCanvasRef, () => svgRef.current!, []);

  const {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDragOver,
      handleDrop,
      mouseWorldPos,
      probeStart,
      probeEnd,
      selectionStart,
      selectionEnd,
      wiringStart,
      wirePoints,
      startMove,
      startWiring,
      completeWiring,
      getProjectedPoint,
      getPortPosition,
      screenToWorld,
      isPanning,
      isDraggingWire,
      hoveredWireSegment,
      hoveredObject,
      autoWireStart
  } = useCanvasEvents(svgRef);

  const snappedMousePos = {
      x: Math.round(mouseWorldPos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(mouseWorldPos.y / GRID_SIZE) * GRID_SIZE
  };

  // Ghost Component Logic
  const ghostDefinition = pendingComponent 
    ? (COMPONENT_LIBRARY.find(c => c.type === pendingComponent.type) || customDefinitions.find(c => c.type === pendingComponent.type))
    : null;

  const getCursor = () => {
      if (pendingComponent) return 'none';
      if (isPanning) return 'grabbing';
      if (activeTool === ToolType.PAN) return 'grab';
      if (activeTool === ToolType.WIRE) return 'crosshair';
      
      // Dragging Wire Cursors
      if (isDraggingWire || hoveredWireSegment) {
          const orientation = isDraggingWire ? 'auto' : hoveredWireSegment?.orientation;
          if (orientation === 'horizontal') return 'ns-resize';
          if (orientation === 'vertical') return 'ew-resize';
          if (isDraggingWire) return 'move'; // Fallback
      }

      if (activeTool === ToolType.MOVE) return 'default';
      if (activeTool === ToolType.DELETE) return 'pointer';
      if (activeTool === ToolType.PROBE) return 'help'; 
      return 'default';
  };

  return (
    <div 
        id="canvas-container"
        className="w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className={`w-full h-full touch-none outline-none`}
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`}>
          
          <GridLayer viewport={viewport} isDarkMode={isDarkMode} />
          
          <GridGuideLayer grids={grids} />

          <WireLayer wires={wires} components={components} />

          <ComponentLayer 
             components={components} 
             selectedComponentIds={selectedComponentIds}
             activeTool={activeTool}
             selectComponent={selectComponent}
             startMove={startMove}
             startWiring={startWiring}
             completeWiring={completeWiring}
             wiringStart={wiringStart}
             getPortPosition={getPortPosition}
             screenToWorld={screenToWorld}
             svgRef={svgRef}
          />

          <BoundingBoxLayer 
             components={components} 
             definitions={[...COMPONENT_LIBRARY, ...customDefinitions]} 
             show={showBoundingBoxes} 
          />
          
           {activeTool === ToolType.WIRE && (
               <WiringOverlay wiringStart={wiringStart} wirePoints={wirePoints} mouseWorldPos={snappedMousePos} getProjectedPoint={getProjectedPoint} />
           )}
           
           <SelectionOverlay start={selectionStart} end={selectionEnd} viewport={viewport} />
           
           <ProbeHighlightLayer 
                components={components}
                hoveredObject={hoveredObject}
                probeMode={probeMode}
                probeStart={probeStart ? {x: probeStart.x, y: probeStart.y} : null}
                probeEnd={probeEnd}
           />

           {/* Auto Wire Highlight */}
           {autoWireStart && (() => {
               const pos = getPortPosition(autoWireStart.componentId, autoWireStart.portId);
               return pos ? (
                   <g transform={`translate(${pos.x}, ${pos.y})`}>
                       <circle r="8" fill="none" stroke="#f59e0b" strokeWidth="2" className="animate-pulse" />
                       <circle r="4" fill="#f59e0b" />
                   </g>
               ) : null;
           })()}

           {/* Ghost Component Layer */}
           {ghostDefinition && (
               <g 
                 transform={`translate(${snappedMousePos.x}, ${snappedMousePos.y})`} 
                 className="opacity-60 pointer-events-none"
                 style={{ color: isDarkMode ? '#60a5fa' : '#2563eb' }}
               >
                   <SymbolShape symbol={ghostDefinition.symbol} />
                   <circle r="2" fill="currentColor" />
               </g>
           )}
           
        </g>
      </svg>
      
      {/* Detailed Probe Menu (Absolute UI Overlay) */}
      {detailedProbeTarget && (
           <ComponentProbeMenu 
                target={{
                    ...detailedProbeTarget,
                    // Convert World -> Screen coordinates for fixed UI positioning
                    x: detailedProbeTarget.x * viewport.k + viewport.x,
                    y: detailedProbeTarget.y * viewport.k + viewport.y
                }}
                onClose={() => setDetailedProbeTarget(null)}
                onSelect={(variable) => {
                    addVariableToActivePane(variable);
                    stopProbing();
                }}
           />
      )}
      
      {/* Zoom Info */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1 rounded shadow text-xs font-mono text-gray-500 dark:text-gray-400 pointer-events-none select-none transition-colors">
          Zoom: {(viewport.k * 100).toFixed(0)}% | X: {Math.round(viewport.x)} Y: {Math.round(viewport.y)}
      </div>

      {/* Probe Status Overlay */}
      {activeTool === ToolType.PROBE && probeMode && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce pointer-events-none z-50">
              {probeMode === 'VOLTAGE' && !probeStart ? "Select a Node (Click)" : ""}
              {probeMode === 'VOLTAGE' && probeStart ? "Select Reference Node (Release)" : ""}
              {probeMode === 'CURRENT' ? "Select a Component" : ""}
              {probeMode === 'COMPONENT_DETAILS' ? "Click a component to inspect" : ""}
          </div>
      )}

      {/* Auto Wire Status Overlay */}
      {activeTool === ToolType.AUTO_WIRE && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce pointer-events-none z-50">
              {!autoWireStart ? "Select First Pin" : "Select Second Pin"}
          </div>
      )}

      {isSimOverlayOpen && <SimulationOverlay />}
    </div>
  );
};
