import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VipTierBadgeProps {
  tier: string;
  className?: string;
}

const getVipTierStyling = (tier: string) => {
  switch (tier) {
    case 'Đại gia':
      return 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg border-red-300';
    case 'Phú ông':
      return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg border-purple-300';
    case 'Thương gia':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg border-blue-300';
    case 'Chủ đồn điền':
      return 'bg-gradient-to-r from-green-500 to-lime-500 text-white shadow-lg border-green-300';
    case 'Nông dân':
      return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg border-yellow-300';
    case 'Đầy tớ':
      return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg border-gray-300';
    case 'Vô danh':
      return 'bg-gradient-to-r from-stone-500 to-neutral-500 text-white shadow-lg border-stone-300';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const VipTierBadge: React.FC<VipTierBadgeProps> = ({ tier, className }) => {
  return (
    <Badge className={cn('px-3 py-1 text-sm font-semibold', getVipTierStyling(tier), className)}>
      {tier}
    </Badge>
  );
};

export default VipTierBadge;
