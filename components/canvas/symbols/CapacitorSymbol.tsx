import React from 'react';

export const CapacitorSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="3" className={className}>
    <line x1="-20" y1="0" x2="-5" y2="0" />
    <line x1="-5" y1="-15" x2="-5" y2="15" strokeWidth="4" />
    <line x1="5" y1="-15" x2="5" y2="15" strokeWidth="4" />
    <line x1="5" y1="0" x2="20" y2="0" />
  </g>
);