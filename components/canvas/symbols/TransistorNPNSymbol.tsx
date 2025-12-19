import React from 'react';

export const TransistorNPNSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" fill="none" className={className}>
    <circle cx="0" cy="0" r="25" strokeWidth="1" />
    <line x1="-15" y1="-15" x2="-15" y2="15" strokeWidth="3" />
    <line x1="-15" y1="-5" x2="15" y2="-15" /> {/* C */}
    <line x1="-15" y1="5" x2="15" y2="15" /> {/* E */}
    <line x1="-20" y1="0" x2="-15" y2="0" /> {/* B conn */}
    <line x1="15" y1="-15" x2="20" y2="-20" /> {/* C conn */}
    <line x1="15" y1="15" x2="20" y2="20" /> {/* E conn */}
    {/* Arrow pointing OUT */}
    <path d="M10,18 L15,15 L10,12" fill="currentColor" stroke="none" />
  </g>
);