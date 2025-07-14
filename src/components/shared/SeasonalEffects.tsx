"use client";

import React, { useMemo } from 'react';

const getSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring'; // March, April, May
  if (month >= 5 && month <= 7) return 'summer'; // June, July, August
  if (month >= 8 && month <= 10) return 'autumn'; // September, October, November
  return 'winter'; // December, January, February
};

const SeasonalEffects: React.FC = () => {
  const season = useMemo(() => getSeason(), []);

  const renderParticles = (particleClass: string, count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className={particleClass} style={{
        left: `${Math.random() * 100}vw`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${5 + Math.random() * 10}s`,
      }} />
    ));
  };

  const seasonClass = `seasonal-bg-${season}`;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${seasonClass}`}>
      {season === 'winter' && renderParticles('snowflake', 50)}
      {season === 'autumn' && renderParticles('leaf', 30)}
      {season === 'spring' && renderParticles('petal', 40)}
      {season === 'summer' && renderParticles('sparkle', 60)}
    </div>
  );
};

export default SeasonalEffects;