import React from 'react';

export const InductorSymbol: React.FC<{ className?: string }> = ({ className }) => (
  <path
    d="M-40,0 L-30,0 Q-25,-15 -20,0 Q-15,-15 -10,0 Q-5,-15 0,0 Q5,-15 10,0 Q15,-15 20,0 Q25,-15 30,0 L40,0"
    stroke="currentColor"
    strokeWidth="3"
    fill="none"
    className={className}
  />
);