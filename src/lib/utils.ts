import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneStr: string | undefined | null): string {
  if (!phoneStr) {
    return 'N/A';
  }
  const cleaned = phoneStr.replace(/\D/g, ''); // Remove non-digits

  // Format for 11-digit numbers like 07084491438 -> 070-8449-1438
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // Format for 10-digit numbers like 0901234567 -> 090-123-4567
  if (cleaned.startsWith('0') && cleaned.length === 10) {
     return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // Fallback for other formats or if cleaning resulted in an empty string
  return cleaned || phoneStr;
}

export function normalizeStringForSearch(str: string | undefined | null): string {
  if (!str) {
    return '';
  }
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function getCustomerTierClass(tier: string | undefined | null): string {
  if (!tier) return "hover:bg-muted/50";
  switch (tier.toLowerCase()) {
    case 'vàng':
      return "bg-yellow-300/70 dark:bg-yellow-700/50 hover:bg-yellow-400/70 dark:hover:bg-yellow-600/60 font-semibold text-yellow-900 dark:text-yellow-100";
    case 'bạc':
      return "bg-slate-300/70 dark:bg-slate-700/50 hover:bg-slate-400/70 dark:hover:bg-slate-600/60 font-semibold text-slate-900 dark:text-slate-100";
    case 'đồng':
      return "bg-orange-300/70 dark:bg-orange-700/50 hover:bg-orange-400/70 dark:hover:bg-orange-600/60 font-semibold text-orange-900 dark:text-orange-100";
    default:
      return "hover:bg-muted/50";
  }
}

export function formatCompactCurrency(amount: number, showUnit: boolean = false): string {
  if (amount === 0) return showUnit ? "0" : "0";
  
  if (amount >= 1000) {
    const thousands = amount / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1);
    return showUnit ? `${formatted}K` : formatted + "K";
  }
  
  return showUnit ? amount.toString() : amount.toString();
}

// Hàm định dạng tiền tệ dành cho khách hàng (ẩn đơn vị VNĐ và chuyển 1000 thành 1K)
export function formatCurrencyForUser(amount: number, isCustomer: boolean = false): string {
  if (isCustomer) {
    // Cho khách hàng: ẩn đơn vị VNĐ và sử dụng định dạng compact
    return formatCompactCurrency(amount, false);
  } else {
    // Cho admin/employee: giữ nguyên định dạng cũ với VNĐ
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  }
}

// Hàm định dạng tiền tệ đầy đủ cho bảng xếp hạng (hiển thị số đầy đủ chứ không rút gọn)
export function formatCurrencyForLeaderboard(amount: number, isCustomer: boolean = false): string {
  if (isCustomer) {
    // Cho khách hàng: ẩn đơn vị VNĐ nhưng hiển thị số đầy đủ
    return amount.toLocaleString('vi-VN');
  } else {
    // Cho admin/employee: hiển thị đầy đủ với VNĐ
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  }
}
