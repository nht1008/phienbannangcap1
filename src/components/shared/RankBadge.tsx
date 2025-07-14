import React from 'react';
import { cn } from '@/lib/utils';

interface RankBadgeProps {
  rank: number;
  className?: string;
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, className }) => {
  const getBadgeStyle = () => {
    if (rank >= 1 && rank <= 3) {
      return {
        container: 'bg-yellow-400 border-yellow-500 shadow-lg shadow-yellow-500/50',
        animation: 'animate-shine',
        halo: rank === 1 ? 'animate-halo' : '',
      };
    }
    if (rank >= 4 && rank <= 10) {
      return {
        container: 'bg-gray-300 border-gray-400 shadow-lg shadow-gray-400/50',
        animation: 'animate-pulse',
        halo: '',
      };
    }
    if (rank >= 11 && rank <= 50) {
      return {
        container: 'bg-orange-400 border-orange-500 shadow-lg shadow-orange-400/50',
        animation: 'animate-breathe',
        halo: '',
      };
    }
    return {
      container: 'bg-gray-200 border-gray-300',
      animation: '',
      halo: '',
    };
  };

  const { container, animation, halo } = getBadgeStyle();

  return (
    <div className={cn(
      'relative rounded-full w-16 h-16 flex items-center justify-center border-4 font-bold text-2xl text-white',
      container,
      animation,
      className
    )}>
      {rank === 1 && <div className={cn('absolute inset-0 rounded-full', halo)}></div>}
      <span className="z-10">{rank}</span>
    </div>
  );
};

export default RankBadge;