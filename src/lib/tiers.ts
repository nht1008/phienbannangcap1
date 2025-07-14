import type { Customer, Invoice } from '@/types';

export const TIERS = {
  'Vô danh': { discount: 0, minOrder: 0, limit: 0, usageLimit: 'Không áp dụng giảm giá' },
  'Đầy tớ': { discount: 0.03, minOrder: 500000, limit: Infinity, usageLimit: 'Tối đa 1 lần/tháng' },
  'Nông dân': { discount: 0.05, minOrder: 1000000, limit: 50000, usageLimit: 'Giảm tối đa 50.000đ/đơn' },
  'Chủ đồn điền': { discount: 0.07, minOrder: 0, limit: 100000, usageLimit: 'Giảm tối đa 100.000đ/đơn, Tối đa 1 lần/tuần' },
  'Thương gia': { discount: 0.08, minOrder: 0, limit: 150000, usageLimit: 'Giảm tối đa 150.000đ/đơn, Tối đa 2 lần/tháng' },
  'Phú ông': { discount: 0.1, minOrder: 0, limit: 200000, usageLimit: 'Giảm tối đa 200.000đ/đơn, Tối đa 3 lần/năm' },
  'Đại gia': { discount: 0.12, minOrder: 0, limit: 250000, usageLimit: 'Giảm tối đa 250.000đ/đơn, Tối đa 4 lần/năm' },
};

interface DiscountResult {
  success: boolean;
  message: string;
  discountAmount: number;
  discountPercentage: number;
  remainingUses?: number;
  usagePeriod?: 'tuần' | 'tháng' | 'năm';
}

export function calculateDiscount(customer: Customer | null, totalAmount: number, invoices: Invoice[]): DiscountResult {
  const noDiscountResult = { success: false, message: 'Khách hàng không có cấp bậc hoặc là khách lẻ.', discountAmount: 0, discountPercentage: 0 };

  if (!customer || !customer.tier || customer.tier === 'Vô danh') {
    return noDiscountResult;
  }

  const tierInfo = TIERS[customer.tier as keyof typeof TIERS];

  if (!tierInfo) {
    return { success: false, message: `Không tìm thấy thông tin cấp bậc "${customer.tier}".`, discountAmount: 0, discountPercentage: 0 };
  }

  if (totalAmount < tierInfo.minOrder) {
    return { 
      success: false, 
      message: `Ưu đãi cấp bậc "${customer.tier}" chỉ áp dụng cho đơn hàng từ ${tierInfo.minOrder.toLocaleString('vi-VN')} VNĐ.`, 
      discountAmount: 0,
      discountPercentage: Math.round(tierInfo.discount * 100 * 100) / 100 // Fix floating point precision
    };
  }

  const discountAmount = Math.min(totalAmount * tierInfo.discount, tierInfo.limit === Infinity ? Infinity : tierInfo.limit);
  
  if (discountAmount === 0) {
     return { success: false, message: 'Không có ưu đãi nào được áp dụng.', discountAmount: 0, discountPercentage: 0 };
  }

  // Check usage limits
  const now = new Date();
  const customerInvoices = invoices.filter(invoice => invoice.customerId === customer.id && invoice.discount && invoice.discount > 0);
  let remainingUses: number | undefined;
  let usagePeriod: 'tuần' | 'tháng' | 'năm' | undefined;

  if (tierInfo.usageLimit.includes('lần/tháng')) {
    const count = parseInt(tierInfo.usageLimit.split(' ')[2], 10);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUses = customerInvoices.filter(invoice => new Date(invoice.date) >= startOfMonth).length;
    remainingUses = count - monthlyUses;
    usagePeriod = 'tháng';
    if (monthlyUses >= count) {
      return { success: false, message: `Đã hết lượt sử dụng ưu đãi trong tháng.`, discountAmount: 0, discountPercentage: 0, remainingUses: 0, usagePeriod };
    }
  }

  if (tierInfo.usageLimit.includes('lần/tuần')) {
    const count = parseInt(tierInfo.usageLimit.split(' ')[2], 10);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weeklyUses = customerInvoices.filter(invoice => new Date(invoice.date) >= startOfWeek).length;
    remainingUses = count - weeklyUses;
    usagePeriod = 'tuần';
    if (weeklyUses >= count) {
      return { success: false, message: `Đã hết lượt sử dụng ưu đãi trong tuần.`, discountAmount: 0, discountPercentage: 0, remainingUses: 0, usagePeriod };
    }
  }

  if (tierInfo.usageLimit.includes('lần/năm')) {
    const count = parseInt(tierInfo.usageLimit.split(' ')[2], 10);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearlyUses = customerInvoices.filter(invoice => new Date(invoice.date) >= startOfYear).length;
    remainingUses = count - yearlyUses;
    usagePeriod = 'năm';
    if (yearlyUses >= count) {
      return { success: false, message: `Đã hết lượt sử dụng ưu đãi trong năm.`, discountAmount: 0, discountPercentage: 0, remainingUses: 0, usagePeriod };
    }
  }

  return { 
    success: true, 
    message: `Áp dụng ưu đãi thành công! Giảm ${discountAmount.toLocaleString('vi-VN')} VNĐ.`,
    discountAmount,
    discountPercentage: Math.round(tierInfo.discount * 100 * 100) / 100, // Fix floating point precision
    remainingUses,
    usagePeriod
  };
}
