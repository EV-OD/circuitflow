import React from 'react';

export const GroundSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="3" className={className}>
    <line x1="0" y1="-20" x2="0" y2="0" />
    <line x1="-15" y1="0" x2="15" y2="0" />
    <line x1="-8" y1="8" x2="8" y2="8" />
    <line x1="-3" y1="16" x2="3" y2="16" />
  </g>
);