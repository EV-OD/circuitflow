import React from 'react';

export const TransformerSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" fill="none" className={className}>
    {/* Core Lines */}
    <line x1="-5" y1="-25" x2="-5" y2="25" />
    <line x1="5" y1="-25" x2="5" y2="25" />

    {/* Primary Coil (Left) */}
    <path d="M -20 -30 Q -5 -20 -20 -10 Q -5 0 -20 10 Q -5 20 -20 30" />
    <line x1="-20" y1="-30" x2="-20" y2="-40" />
    <line x1="-20" y1="30" x2="-20" y2="40" />

    {/* Secondary Coil (Right) */}
    <path d="M 20 -30 Q 5 -20 20 -10 Q 5 0 20 10 Q 5 20 20 30" />
    <line x1="20" y1="-30" x2="20" y2="-40" />
    <line x1="20" y1="30" x2="20" y2="40" />
  </g>
);
