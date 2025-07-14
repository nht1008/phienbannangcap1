import React from 'react';

export const WavingHand = ({ className }: { className?: string }) => (
  <div
    className={`waving-hand-emoji ${className}`}
    style={{
      animation: 'wave-animation 2.5s infinite',
      transformOrigin: '70% 70%',
      display: 'inline-block',
    }}
  >
    👋
  </div>
);