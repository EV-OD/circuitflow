
import React from 'react';
import { Wire as WireType, CircuitComponent, ToolType } from '../../types';
import { COMPONENT_LIBRARY, GRID_SIZE } from '../../constants';
import { useDelete } from '../../hooks/useDelete';
import { useCircuit } from '../../context/CircuitContext';
import { getProjectedPortPosition } from '../../services/circuitUtils';

interface WireProps {
  wire: WireType;
  components: CircuitComponent[];
  isSelected?: boolean;
}

export const Wire: React.FC<WireProps> = ({ wire, components, isSelected }) => {
  const { isDeleteMode, deleteItem } = useDelete();
  const { customDefinitions, activeTool } = useCircuit();

  const sourceComp = components.find(c => c.id === wire.sourceComponentId);
  const destComp = components.find(c => c.id === wire.destComponentId);

  // If components haven't rendered yet or don't exist, we can't draw the wire
  if (!sourceComp || !destComp) return null;

  const getPortPosition = (comp: CircuitComponent, portId: string) => {
    // Check both standard library and custom definitions
    const def = COMPONENT_LIBRARY.find(c => c.type === comp.definitionType) || 
                customDefinitions.find(c => c.type === comp.definitionType);
                
    if (!def) return { x: comp.x, y: comp.y }; // Fallback to component center
    
    const pos = getProjectedPortPosition(
        comp, 
        portId, 
        [...COMPONENT_LIBRARY, ...customDefinitions],
        GRID_SIZE
    );

    return pos || { x: comp.x, y: comp.y };
  };

  const p1 = getPortPosition(sourceComp, wire.sourcePortId);
  const p2 = getPortPosition(destComp, wire.destPortId);

  // Sanity check coordinates
  if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) return null;

  // Construct points string for polyline
  let pointsStr = `${p1.x},${p1.y}`;
  if (wire.points && wire.points.length > 0) {
      wire.points.forEach(p => {
          if (!isNaN(p.x) && !isNaN(p.y)) {
              pointsStr += ` ${p.x},${p.y}`;
          }
      });
  }
  pointsStr += ` ${p2.x},${p2.y}`;

  const handleClick = (e: React.MouseEvent) => {
    if (isDeleteMode) {
      e.stopPropagation();
      deleteItem('wire', wire.id);
    }
    // Selection is handled globally by useMouseInteraction spatial check for consistent behavior (click vs drag)
  };

  return (
    <g 
      className={`group ${isDeleteMode ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* Hit Area (Invisible but clickable) */}
      <polyline
        points={pointsStr}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Selection Highlight (Halo) */}
      {isSelected && (
          <polyline
            points={pointsStr}
            stroke="#60a5fa" // light blue
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
            pointerEvents="none"
          />
      )}

      {/* Visual Wire */}
      <polyline
        points={pointsStr}
        stroke={isSelected ? "#2563eb" : "#2563eb"} // blue-600
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          transition-colors duration-150
          ${isDeleteMode 
            ? 'opacity-80 group-hover:stroke-red-500 group-hover:opacity-100' 
            : 'opacity-80 hover:opacity-100 hover:stroke-blue-600'
          }
        `}
      />
      
      {/* Endpoints */}
      <circle 
        cx={p1.x} cy={p1.y} r="4" 
        className={`${isDeleteMode ? 'group-hover:fill-red-500' : 'fill-[#1d4ed8]'}`} 
      />
      <circle 
        cx={p2.x} cy={p2.y} r="4" 
        className={`${isDeleteMode ? 'group-hover:fill-red-500' : 'fill-[#1d4ed8]'}`} 
      />
    </g>
  );
};
