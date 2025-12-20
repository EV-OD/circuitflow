import React from 'react';

export const OpAmpSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <g stroke="currentColor" strokeWidth="2" fill="none" className={className}>
    {/* Main Triangle Body */}
    <path d="M -30 -35 L -30 35 L 35 0 Z" />
    
    {/* Input Signs */}
    <text x="-25" y="-15" fontSize="14" fontWeight="bold" stroke="none" fill="currentColor">-</text>
    <text x="-25" y="25" fontSize="14" fontWeight="bold" stroke="none" fill="currentColor">+</text>
    
    {/* Connection Stubs (Visual only, ports handle actual connection points) */}
    {/* Inverting Input (-40, -20) to (-30, -20) */}
    <line x1="-40" y1="-20" x2="-30" y2="-20" />
    
    {/* Non-Inverting Input (-40, 20) to (-30, 20) */}
    <line x1="-40" y1="20" x2="-30" y2="20" />
    
    {/* Output (35, 0) to (40, 0) */}
    <line x1="35" y1="0" x2="40" y2="0" />
    
    {/* Power Rails */}
    {/* V+ (0, -40) to (0, -18) approx on slope */}
    <line x1="0" y1="-40" x2="0" y2="-18" />
    
    {/* V- (0, 40) to (0, 18) approx on slope */}
    <line x1="0" y1="40" x2="0" y2="18" />
  </g>
);
