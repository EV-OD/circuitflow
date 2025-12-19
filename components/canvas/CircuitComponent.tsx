
import React from 'react';
import { CircuitComponent, ComponentDefinition, ToolType } from '../../types';
import { COMPONENT_LIBRARY } from '../../constants';
import { useCircuit } from '../../context/CircuitContext';
import { useDelete } from '../../hooks/useDelete';
import { SymbolShape } from './SymbolShape';

interface Props {
  data: CircuitComponent;
  isSelected: boolean;
  onPortClick: (compId: string, portId: string, e: React.MouseEvent) => void;
  onMouseDown: (compId: string, e: React.MouseEvent) => void;
}

export const CircuitComponentNode: React.FC<Props> = ({ data, isSelected, onPortClick, onMouseDown }) => {
  const { updateComponent, activeTool, customDefinitions } = useCircuit();
  const { isDeleteMode, deleteItem } = useDelete();
  
  const definition = COMPONENT_LIBRARY.find(c => c.type === data.definitionType) || 
                     customDefinitions.find(c => c.type === data.definitionType);

  const rotate = () => {
    updateComponent(data.id, { rotation: (data.rotation + 90) % 360 });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDeleteMode) {
      e.stopPropagation();
      deleteItem('component', data.id);
    }
  };
  
  const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      rotate();
  };

  const isMoveMode = activeTool === ToolType.MOVE;

  if (!definition) return null;

  return (
    <g
      transform={`translate(${data.x}, ${data.y}) rotate(${data.rotation})`}
      className={`group transition-opacity outline-none ${isMoveMode ? 'cursor-move' : (isDeleteMode ? 'cursor-pointer' : 'cursor-pointer')}`}
      onClick={handleClick}
      onMouseDown={(e) => {
          if (!isDeleteMode && isMoveMode) {
              e.stopPropagation();
              onMouseDown(data.id, e);
          }
      }}
      onContextMenu={handleRightClick}
      data-component-id={data.id}
    >
      {/* Hit Area */}
      <rect
        x="-50"
        y="-50"
        width="100"
        height="100"
        rx="8"
        className={`
            transition-all duration-200
            ${isSelected 
                ? 'stroke-blue-500 stroke-2 fill-blue-50/10 dark:fill-blue-500/20' 
                : (isDeleteMode
                    ? 'fill-transparent stroke-transparent group-hover:stroke-red-500 group-hover:fill-red-50/10 group-hover:stroke-2'
                    : (isMoveMode 
                        ? 'fill-transparent stroke-transparent hover:fill-blue-500/10 hover:stroke-blue-400 hover:stroke-dashed' 
                        : 'fill-transparent stroke-transparent hover:stroke-gray-300 dark:hover:stroke-gray-600 hover:stroke-dashed')
                  )
            }
        `}
        strokeDasharray={isSelected || isDeleteMode ? "" : "4 4"}
      />

      {/* Symbol Rendering */}
      <g className={`pointer-events-none ${isDeleteMode ? 'text-red-700 dark:text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
          <SymbolShape symbol={definition.symbol} />
      </g>

      {/* Designator (Top) */}
      <text
        x="0"
        y="-35"
        textAnchor="middle"
        className={`text-xs font-bold font-mono select-none pointer-events-none transition-colors ${isDeleteMode ? 'fill-red-600' : 'fill-blue-600 dark:fill-blue-400'}`}
        style={{ fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        transform={`rotate(${-data.rotation})`} // Counter-rotate text so it stays upright
      >
        {data.designator}
      </text>

      {/* Label (Bottom) */}
      <text
        x="0"
        y="50"
        textAnchor="middle"
        className={`text-xs font-sans select-none pointer-events-none transition-colors ${isDeleteMode ? 'fill-red-600' : 'fill-gray-500 dark:fill-gray-400'}`}
        style={{ fontSize: '10px' }}
        transform={`rotate(${-data.rotation})`} // Counter-rotate text
      >
        {definition.label} 
      </text>

      {/* Ports */}
      {definition.ports.map(port => (
        <circle
          key={port.id}
          cx={port.x}
          cy={port.y}
          r="6"
          fill="transparent"
          stroke="transparent"
          className={`
              ${(isMoveMode || isDeleteMode) ? 'pointer-events-none' : 'cursor-crosshair hover:fill-red-400 hover:stroke-red-600'}
          `}
          strokeWidth="2"
          onClick={(e) => {
            e.stopPropagation();
            if (!isMoveMode && !isDeleteMode) onPortClick(data.id, port.id, e);
          }}
        />
      ))}
      
      {definition.ports.map(port => (
          <circle
          key={`vis-${port.id}`}
          cx={port.x}
          cy={port.y}
          r="3"
          fill="currentColor"
          className={`pointer-events-none ${isDeleteMode ? 'text-red-700' : 'text-gray-800 dark:text-gray-300'}`}
        />
      ))}
      
      {definition.symbol === 'generic' && definition.ports.map(port => (
          <text
            key={`lbl-${port.id}`}
            x={port.x}
            y={port.y}
            dx={port.x < 0 ? -8 : 8}
            dy={3}
            textAnchor={port.x < 0 ? 'end' : 'start'}
            className="text-[8px] fill-gray-500 dark:fill-gray-400 pointer-events-none"
          >
              {port.id}
          </text>
      ))}
    </g>
  );
};
