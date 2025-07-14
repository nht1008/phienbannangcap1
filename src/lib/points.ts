import type { Customer } from '@/types';

export const POINT_CONVERSION_RATE = 1 / 1000; // 1 point per 1000 VND

export const TIER_POINT_MULTIPLIERS: Record<string, number> = {
  'Vô danh': 1,
  'Đầy tớ': 1.1,
  'Nông dân': 1.1,
  'Chủ đồn điền': 1.2,
  'Thương gia': 1.2,
  'Phú ông': 1.5,
  'Đại gia': 2,
};

export const REDEMPTION_OPTIONS = [
  { points: 500, value: 5000, minOrder: 200000 },
  { points: 1000, value: 10000, minOrder: 200000 },
  { points: 2000, value: 30000, minOrder: 200000 },
  { points: 5000, value: 80000, minOrder: 200000 },
];

export function calculatePoints(totalAmount: number, customerTier: string | undefined, amountPaid?: number): number {
  const tier = customerTier || 'Vô danh';
  const multiplier = TIER_POINT_MULTIPLIERS[tier] || 1;
  
  // Chỉ tích điểm cho số tiền khách đã trả, không tích điểm cho phần nợ
  const pointCalculationAmount = amountPaid !== undefined ? amountPaid : totalAmount;
  const basePoints = pointCalculationAmount * POINT_CONVERSION_RATE;
  return Math.floor(basePoints * multiplier);
}
