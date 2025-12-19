import React from 'react';

export const SourceDCSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="0" cy="0" r="25" fill="none" />
    <line x1="0" y1="-40" x2="0" y2="-25" />
    <line x1="0" y1="25" x2="0" y2="40" />
    <text x="5" y="-5" fontSize="16" fontWeight="bold" stroke="none" fill="currentColor">+</text>
    <text x="5" y="15" fontSize="16" fontWeight="bold" stroke="none" fill="currentColor">-</text>
  </g>
);