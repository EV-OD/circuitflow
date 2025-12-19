import React from 'react';

export const GenericSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <rect
    x="-25"
    y="-25"
    width="50"
    height="50"
    stroke="currentColor"
    strokeWidth="3"
    fill="none"
    className={className}
  />
);