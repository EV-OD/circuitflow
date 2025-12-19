
import React from 'react';
import { Wire as WireType, CircuitComponent } from '../../../types';
import { Wire } from '../Wire';
import { useCircuit } from '../../../context/CircuitContext';

interface WireLayerProps {
  wires: WireType[];
  components: CircuitComponent[];
}

export const WireLayer: React.FC<WireLayerProps> = ({ wires, components }) => {
  const { selectedWireId } = useCircuit();

  return (
    <>
      {wires.map(wire => (
          <Wire 
            key={wire.id} 
            wire={wire} 
            components={components} 
            isSelected={selectedWireId === wire.id}
          />
      ))}
    </>
  );
};
