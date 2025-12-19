import React from 'react';

export const SourceCurrentSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="0" cy="0" r="25" fill="none" />
    <line x1="0" y1="-40" x2="0" y2="-25" />
    <line x1="0" y1="25" x2="0" y2="40" />
    {/* Arrow pointing down */}
    <line x1="0" y1="-15" x2="0" y2="15" />
    <path d="M-5,10 L0,15 L5,10" fill="none" strokeWidth="2" />
  </g>
);