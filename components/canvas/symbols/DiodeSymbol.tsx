import React from 'react';

export const DiodeSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="3" fill="none" className={className}>
      <line x1="-30" y1="0" x2="-15" y2="0" />
      <line x1="15" y1="0" x2="30" y2="0" />
      {/* Triangle */}
      <path d="M-15,-12 L15,0 L-15,12 Z" strokeWidth="2" />
      {/* Bar */}
      <line x1="15" y1="-12" x2="15" y2="12" strokeWidth="3" />
  </g>
);