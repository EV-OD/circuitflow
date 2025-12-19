import React from 'react';

export const ResistorSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <path
    d="M-40,0 L-25,0 L-20,-10 L-10,10 L0,-10 L10,10 L20,-10 L25,0 L40,0"
    stroke="currentColor"
    strokeWidth="3"
    fill="none"
    className={className}
  />
);