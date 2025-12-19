
import React from 'react';

export const SourcePulseSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="0" cy="0" r="25" fill="none" />
    <line x1="0" y1="-40" x2="0" y2="-25" />
    <line x1="0" y1="25" x2="0" y2="40" />
    {/* Square Wave Pulse Icon */}
    <polyline points="-12,5 -12,-5 0,-5 0,5 12,5" fill="none" strokeWidth="2" />
    <text x="12" y="-12" fontSize="10" fontWeight="bold" stroke="none" fill="currentColor">+</text>
  </g>
);
