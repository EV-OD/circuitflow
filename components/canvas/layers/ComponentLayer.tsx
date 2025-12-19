
import React from 'react';
import { CircuitComponent, ToolType, XY } from '../../../types';
import { CircuitComponentNode } from '../CircuitComponent';
import { useCircuit } from '../../../context/CircuitContext';

interface ComponentLayerProps {
  components: CircuitComponent[];
  selectedComponentIds: string[];
  activeTool: ToolType;
  selectComponent: (id: string, multi: boolean) => void;
  startMove: (id: string, pos: XY) => void;
  startWiring: (id: string, portId: string, pos: XY) => void;
  completeWiring: (id: string, portId: string) => void;
  wiringStart: any;
  getPortPosition: (compId: string, portId: string) => XY | null;
  screenToWorld: (x: number, y: number) => XY;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const ComponentLayer: React.FC<ComponentLayerProps> = ({
  components,
  selectedComponentIds,
  activeTool,
  selectComponent,
  startMove,
  startWiring,
  completeWiring,
  wiringStart,
  getPortPosition,
  screenToWorld,
  svgRef
}) => {
  
  const handleComponentMouseDown = (id: string, e: React.MouseEvent) => {
      if (activeTool === ToolType.PAN || activeTool === ToolType.PROBE || activeTool === ToolType.WIRE) {
          return; 
      }
      if (activeTool === ToolType.MOVE) {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
          startMove(id, worldPos);
      }
  };

  const handlePortClick = (cid: string, pid: string, e: React.MouseEvent) => {
       if (activeTool === ToolType.WIRE) {
            const p = getPortPosition(cid, pid);
            if (p) !wiringStart ? startWiring(cid, pid, p) : completeWiring(cid, pid);
       }
  };

  return (
    <>
      {components.map(comp => (
        <g key={comp.id} onClick={(e) => { e.stopPropagation(); if (activeTool === ToolType.MOVE) selectComponent(comp.id, e.shiftKey); }}>
            <CircuitComponentNode 
                data={comp} 
                isSelected={selectedComponentIds.includes(comp.id)}
                onPortClick={handlePortClick}
                onMouseDown={handleComponentMouseDown}
            />
        </g>
      ))}
    </>
  );
};
