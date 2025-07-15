"use client";

import React, { useMemo } from 'react';
import type { Customer, Invoice, Debt, DebtPayment } from '@/types';
import { Trophy } from 'lucide-react';
import { cn, normalizeStringForSearch } from '@/lib/utils';

interface TopSpenderMarqueeProps {
  customers: Customer[];
  invoices: Invoice[];
  debts: Debt[];
}

interface MonthlySpender {
  name: string;
  monthlySpent: number;
}

export function TopSpenderMarquee({ customers, invoices, debts }: TopSpenderMarqueeProps) {
  const { topSpenders, currentMonth, currentYear } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });

    const spendingMap = new Map<string, number>();

    monthlyInvoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName.replace(/\s/g, '') !== 'khachle') {
        const currentSpent = spendingMap.get(normalizedName) || 0;
        // Chỉ tính số tiền đã thanh toán thực tế, không tính số tiền nợ
        const paidAmount = invoice.amountPaid || 0;
        spendingMap.set(normalizedName, currentSpent + paidAmount);
      }
    });

    // Lưu ý: Không tính thêm thanh toán công nợ vào chi tiêu tháng hiện tại
    // vì thanh toán nợ chỉ là việc thanh toán các khoản nợ từ hóa đơn trước đó
    // Chi tiêu tháng hiện tại chỉ tính từ các hóa đơn mới trong tháng này

    const sortedSpenders = Array.from(spendingMap.entries()).map(([normalizedName, totalSpent]) => {
      const customer = customers.find(c => normalizeStringForSearch(c.name) === normalizedName);
      return {
        name: customer ? customer.name : normalizedName,
        monthlySpent: totalSpent,
      };
    })
      .filter(s => s.monthlySpent > 0)
      .sort((a, b) => b.monthlySpent - a.monthlySpent)
      .slice(0, 10);

    return { topSpenders: sortedSpenders, currentMonth: currentMonth + 1, currentYear };
  }, [customers, invoices, debts]);

  if (topSpenders.length === 0) {
    return null;
  }

  const marqueeTitle = `🏆 KHÁCH HÀNG CHI TIÊU NHIỀU NHẤT THÁNG ${currentMonth}/${currentYear} 🏆`;

  const spendersList = topSpenders.map((spender, index) => (
    <span key={index} className="mx-8 flex items-center whitespace-nowrap">
      <span className={cn(
        "flex items-center justify-center h-6 w-6 rounded-full text-sm font-bold mr-2",
        index === 0 && "bg-yellow-400 text-yellow-900",
        index === 1 && "bg-gray-300 text-gray-800",
        index === 2 && "bg-orange-400 text-orange-900",
        index > 2 && "bg-gray-600 text-white"
      )}>
        {index + 1}
      </span>
      <span className="font-semibold text-white">{spender.name}:</span>
      <span className="ml-2 font-bold text-green-300">{spender.monthlySpent.toLocaleString('vi-VN')} VNĐ</span>
    </span>
  ));

  const marqueeContent = (
    <div className="flex items-center whitespace-nowrap">
      <span className="mx-8 font-bold text-yellow-300">{marqueeTitle}</span>
      <span className="text-gray-500 mx-4">•</span>
      {spendersList}
      <span className="text-gray-500 mx-4">•</span>
    </div>
  );

  return (
    <div className="relative flex overflow-hidden bg-gray-800/90 backdrop-blur-sm border-b border-t border-gray-700 py-2 shadow-lg">
      <div className="animate-marquee whitespace-nowrap">
        {marqueeContent}
      </div>
      <div className="absolute top-0 animate-marquee2 whitespace-nowrap" style={{ left: '100%' }}>
        {marqueeContent}
      </div>
    </div>
  );
}