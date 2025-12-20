import React from 'react';

export const SourceCosineSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="0" cy="0" r="25" fill="none" />
    <line x1="0" y1="-40" x2="0" y2="-25" />
    <line x1="0" y1="25" x2="0" y2="40" />
    {/* Cosine-ish path */}
    <path d="M -15 -8 C -5 -8, -5 8, 15 8" fill="none" />
  </g>
);
