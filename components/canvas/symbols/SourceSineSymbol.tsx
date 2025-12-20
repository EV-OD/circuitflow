import React from 'react';

export const SourceSineSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="0" cy="0" r="25" fill="none" />
    <line x1="0" y1="-40" x2="0" y2="-25" />
    <line x1="0" y1="25" x2="0" y2="40" />
    {/* Sine wave path */}
    <path d="M -15 0 Q -7.5 -15 0 0 T 15 0" fill="none" />
  </g>
);
