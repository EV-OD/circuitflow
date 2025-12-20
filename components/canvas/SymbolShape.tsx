
import React from 'react';
import { ResistorSymbol } from './symbols/ResistorSymbol';
import { CapacitorSymbol } from './symbols/CapacitorSymbol';
import { InductorSymbol } from './symbols/InductorSymbol';
import { DiodeSymbol } from './symbols/DiodeSymbol';
import { SourceDCSymbol } from './symbols/SourceDCSymbol';
import { SourceCurrentSymbol } from './symbols/SourceCurrentSymbol';
import { SourcePulseSymbol } from './symbols/SourcePulseSymbol';
import { SourceSineSymbol } from './symbols/SourceSineSymbol';
import { SourceCosineSymbol } from './symbols/SourceCosineSymbol';
import { GroundSymbol } from './symbols/GroundSymbol';
import { TransistorNPNSymbol } from './symbols/TransistorNPNSymbol';
import { TransistorPNPSymbol } from './symbols/TransistorPNPSymbol';
import { TransistorNMOSSymbol } from './symbols/TransistorNMOSSymbol';
import { TransistorPMOSSymbol } from './symbols/TransistorPMOSSymbol';
import { GenericSymbol } from './symbols/GenericSymbol';

interface SymbolShapeProps {
  symbol: string;
  className?: string;
}

export const SymbolShape: React.FC<SymbolShapeProps> = ({ symbol, className = "" }) => {
  switch (symbol) {
    case 'resistor':
      return <ResistorSymbol className={className} />;
    case 'capacitor':
      return <CapacitorSymbol className={className} />;
    case 'inductor':
      return <InductorSymbol className={className} />;
    case 'diode':
      return <DiodeSymbol className={className} />;
    case 'source_dc':
      return <SourceDCSymbol className={className} />;
    case 'source_pulse':
      return <SourcePulseSymbol className={className} />;
    case 'source_sine':
      return <SourceSineSymbol className={className} />;
    case 'source_cosine':
      return <SourceCosineSymbol className={className} />;
    case 'source_current':
      return <SourceCurrentSymbol className={className} />;
    case 'gnd':
      return <GroundSymbol className={className} />;
    case 'transistor_npn':
      return <TransistorNPNSymbol className={className} />;
    case 'transistor_pnp':
      return <TransistorPNPSymbol className={className} />;
    case 'transistor_nmos':
        return <TransistorNMOSSymbol className={className} />;
    case 'transistor_pmos':
        return <TransistorPMOSSymbol className={className} />;
    default:
      return <GenericSymbol className={className} />;
  }
};
