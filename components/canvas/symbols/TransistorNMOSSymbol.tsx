import React from 'react';

export const TransistorNMOSSymbol: React.FC<{ className?: string }> = ({ className }) => (
    <g stroke="currentColor" strokeWidth="2" fill="none" className={className}>
        <circle cx="0" cy="0" r="25" strokeWidth="1" />
        {/* Gate */}
        <line x1="-15" y1="-15" x2="-15" y2="15" />
        <line x1="-20" y1="0" x2="-15" y2="0" />
        
        {/* Channel (Broken) */}
        <line x1="-5" y1="-15" x2="-5" y2="-7" />
        <line x1="-5" y1="-3" x2="-5" y2="3" />
        <line x1="-5" y1="7" x2="-5" y2="15" />

        {/* Drain */}
        <line x1="-5" y1="-15" x2="15" y2="-15" />
        <line x1="15" y1="-15" x2="20" y2="-20" />

        {/* Source */}
        <line x1="-5" y1="15" x2="15" y2="15" />
        <line x1="15" y1="15" x2="20" y2="20" />

        {/* Substrate/Source Arrow Pointing OUT for NMOS */}
        <path d="M-5,0 L5,0" />
        <path d="M2,-3 L5,0 L2,3" fill="currentColor" stroke="none" />
    </g>
);