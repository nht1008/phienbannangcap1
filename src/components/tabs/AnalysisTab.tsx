"use client";

import React, { useMemo, useState } from 'react';
import type { Invoice, Product, DisposalLogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, subDays, eachDayOfInterval, parseISO, eachMonthOfInterval, getMonth, getYear, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, DollarSign, ShoppingBag, TrendingUp, FileText } from 'lucide-react';
import type { ActivityDateTimeFilter, CustomerInsight } from '@/app/page';
import { CustomerAnalysisReport } from '../analysis/CustomerAnalysisReport';
import { InventoryAlerts } from '../analysis/InventoryAlerts';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { RevenueProfitTrendChart } from '../analysis/RevenueProfitTrendChart';
import { TopSellingProductsTable } from '../analysis/TopSellingProductsTable';
import { SlowSellingProductsTable } from '../analysis/SlowSellingProductsTable';
import { KpiCard } from '../analysis/KpiCard';
import { SlowMovingFilter } from '../analysis/SlowMovingFilter';
import { TopSellingFilter } from '../analysis/TopSellingFilter';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalysisTabProps {
  invoices: Invoice[];
  inventory: Product[];
  disposalLogEntries: DisposalLogEntry[];
  customerInsights: CustomerInsight;
  filter: ActivityDateTimeFilter;
  onFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  isLoading: boolean;
}

export default function AnalysisTab({ invoices, inventory, disposalLogEntries, customerInsights, filter, onFilterChange, isLoading }: AnalysisTabProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [activeTab, setActiveTab] = useState('revenue');
  const [slowMovingDateRange, setSlowMovingDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [topSellingDateRange, setTopSellingDateRange] = useState<DateRange | undefined>({
      from: subDays(new Date(), 30),
      to: new Date(),
  });
  const [topN, setTopN] = useState<number>(10);
  const [applyNoSalesFilter, setApplyNoSalesFilter] = useState<boolean>(true);
  const [applySalesLessThanFilter, setApplySalesLessThanFilter] = useState<boolean>(false);
  const [salesLessThanUnits, setSalesLessThanUnits] = useState<number>(5);
  const [applyDisposedFilter, setApplyDisposedFilter] = useState<boolean>(true);
  
  const handleDateChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      onFilterChange({
        ...filter,
        startDate: dateRange.from || null,
        endDate: dateRange.to || null,
      });
    }
  };

  const setDateRangePreset = (preset: 'today' | 'last_7_days' | 'last_30_days' | 'this_month') => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (preset) {
      case 'today':
        from = now;
        break;
      case 'last_7_days':
        from = subDays(now, 6);
        break;
      case 'last_30_days':
        from = subDays(now, 29);
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
    }
    onFilterChange({ ...filter, startDate: from, endDate: to });
  };


  const trendData = useMemo(() => {
    if (!filter.startDate || !filter.endDate) return [];

    if (viewMode === 'yearly') {
      const yearlyData: { [key: string]: { date: string; revenue: number; profit: number } } = {};

      invoices.forEach(invoice => {
        const year = getYear(parseISO(invoice.date)).toString();
        if (!yearlyData[year]) {
          yearlyData[year] = { date: year, revenue: 0, profit: 0 };
        }
        const cost = invoice.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantityInCart, 0);
        yearlyData[year].revenue += invoice.total;
        yearlyData[year].profit += (invoice.total - cost);
      });

      return Object.values(yearlyData).sort((a, b) => a.date.localeCompare(b.date));
    }

    if (viewMode === 'monthly') {
      const interval = eachMonthOfInterval({
        start: filter.startDate,
        end: filter.endDate,
      });
      const monthlyData = interval.map(month => ({
        date: format(month, 'MM/yyyy'),
        revenue: 0,
        profit: 0,
      }));

      invoices.forEach(invoice => {
        const invoiceDate = parseISO(invoice.date);
        const monthKey = format(invoiceDate, 'MM/yyyy');
        const monthData = monthlyData.find(d => d.date === monthKey);

        if (monthData) {
          const cost = invoice.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantityInCart, 0);
          monthData.revenue += invoice.total;
          monthData.profit += (invoice.total - cost);
        }
      });
      return monthlyData;
    }

    // Daily view
    const interval = eachDayOfInterval({
      start: filter.startDate,
      end: filter.endDate,
    });

    const dailyData = interval.map(day => ({
      date: format(day, 'dd/MM'),
      revenue: 0,
      profit: 0,
    }));

    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.date);
      const formattedDate = format(invoiceDate, 'dd/MM');
      const dayData = dailyData.find(d => d.date === formattedDate);

      if (dayData) {
        const cost = invoice.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantityInCart, 0);
        dayData.revenue += invoice.total;
        dayData.profit += (invoice.total - cost);
      }
    });

    return dailyData;
  }, [invoices, filter.startDate, filter.endDate, viewMode]);

  const kpiData = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCost = invoices.reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantityInCart, 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalInvoices = invoices.length;

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      totalInvoices,
    };
  }, [invoices]);

  const topSellingProducts = useMemo(() => {
    if (!topSellingDateRange?.from || !topSellingDateRange?.to) return [];

    const startDate = startOfDay(topSellingDateRange.from);
    const endDate = endOfDay(topSellingDateRange.to);

    const productPerformance: Record<string, { name: string; sold: number; revenue: number; profit: number; key: string; color?: string; size?: string; quality?: string; unit?: string }> = {};
    
    const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = parseISO(invoice.date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
    });

    filteredInvoices.forEach(invoice => {
        invoice.items.forEach(item => {
            const key = `${item.id}-${item.color}-${item.size}`;
            const revenue = item.price * item.quantityInCart - (item.itemDiscount || 0);
            const cost = (item.costPrice || 0) * item.quantityInCart;
            const profit = revenue - cost;

            if (!productPerformance[key]) {
                productPerformance[key] = {
                    name: item.name,
                    sold: 0,
                    revenue: 0,
                    profit: 0,
                    key,
                    color: item.color,
                    size: item.size,
                    quality: item.quality,
                    unit: item.unit,
                };
            }
            productPerformance[key].sold += item.quantityInCart;
            productPerformance[key].revenue += revenue;
            productPerformance[key].profit += profit;
        });
    });

    return Object.values(productPerformance)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, topN);
  }, [invoices, topSellingDateRange, topN]);

  const slowSellingProducts = useMemo(() => {
    if (!slowMovingDateRange?.from || !slowMovingDateRange?.to) return [];

    const startDate = startOfDay(slowMovingDateRange.from);
    const endDate = endOfDay(slowMovingDateRange.to);

    const salesInDateRange: Record<string, { sold: number; revenue: number; profit: number; lastSaleDate?: string }> = {};

    invoices.forEach(invoice => {
      const invoiceDate = parseISO(invoice.date);
      if (invoiceDate >= startDate && invoiceDate <= endDate) {
        invoice.items.forEach(item => {
          const key = `${item.id}-${item.color}-${item.size}`;
          if (!salesInDateRange[key]) {
            salesInDateRange[key] = { sold: 0, revenue: 0, profit: 0, lastSaleDate: undefined };
          }
          const revenue = item.price * item.quantityInCart - (item.itemDiscount || 0);
          const cost = (item.costPrice || 0) * item.quantityInCart;
          const profit = revenue - cost;

          salesInDateRange[key].sold += item.quantityInCart;
          salesInDateRange[key].revenue += revenue;
          salesInDateRange[key].profit += profit;

          if (!salesInDateRange[key].lastSaleDate || invoiceDate > parseISO(salesInDateRange[key].lastSaleDate!)) {
            salesInDateRange[key].lastSaleDate = invoice.date;
          }
        });
      }
    });

    // Tạo map của sản phẩm đã loại bỏ trong khoảng thời gian
    const disposedProductsInRange: Record<string, { quantityDisposed: number; lastDisposalDate?: string; disposalReasons: string[] }> = {};

    disposalLogEntries.forEach(disposal => {
      const disposalDate = parseISO(disposal.disposalDate);
      if (disposalDate >= startDate && disposalDate <= endDate) {
        const key = `${disposal.productId}-${disposal.color}-${disposal.size}`;
        
        if (!disposedProductsInRange[key]) {
          disposedProductsInRange[key] = { quantityDisposed: 0, lastDisposalDate: undefined, disposalReasons: [] };
        }

        disposedProductsInRange[key].quantityDisposed += disposal.quantityDisposed;
        if (!disposedProductsInRange[key].lastDisposalDate || disposalDate > parseISO(disposedProductsInRange[key].lastDisposalDate!)) {
          disposedProductsInRange[key].lastDisposalDate = disposal.disposalDate;
        }
        
        // Thêm lý do loại bỏ nếu chưa có
        if (!disposedProductsInRange[key].disposalReasons.includes(disposal.reason)) {
          disposedProductsInRange[key].disposalReasons.push(disposal.reason);
        }
      }
    });

    const allProductsAsPerformance = inventory.map(p => {
        const key = `${p.id}-${p.color}-${p.size}`;
        const disposalInfo = disposedProductsInRange[key];
        const salesInfo = salesInDateRange[key];
        
        return {
            key,
            id: p.id,
            name: p.name,
            soldInPeriod: salesInfo?.sold || 0,
            revenueInPeriod: salesInfo?.revenue || 0,
            profitInPeriod: salesInfo?.profit || 0,
            color: p.color,
            size: p.size,
            quality: p.quality,
            unit: p.unit,
            currentStock: p.quantity,
            images: p.images || [],
            // Thông tin về sản phẩm đã loại bỏ
            quantityDisposed: disposalInfo?.quantityDisposed || 0,
            lastDisposalDate: disposalInfo?.lastDisposalDate,
            disposalReasons: disposalInfo?.disposalReasons || [],
        };
    });

    const filteredProducts = allProductsAsPerformance.filter(product => {
        let isSlowMoving = false;
        
        // Sản phẩm có disposal (chỉ khi bật filter disposal)
        if (applyDisposedFilter && product.quantityDisposed > 0) {
          isSlowMoving = true;
        }
        
        // Áp dụng filter không có bán hàng
        if (applyNoSalesFilter && product.soldInPeriod === 0) {
          isSlowMoving = true;
        }
        
        // Áp dụng filter bán ít hơn threshold
        if (applySalesLessThanFilter && product.soldInPeriod > 0 && product.soldInPeriod < salesLessThanUnits) {
          isSlowMoving = true;
        }
        
        return isSlowMoving;
    });

    return filteredProducts.sort((a, b) => {
        // Sắp xếp theo: sản phẩm có loại bỏ trước, sau đó theo số lượng bán
        if (a.quantityDisposed > 0 && b.quantityDisposed === 0) return -1;
        if (a.quantityDisposed === 0 && b.quantityDisposed > 0) return 1;
        return a.soldInPeriod - b.soldInPeriod;
    });
  }, [invoices, inventory, disposalLogEntries, slowMovingDateRange, applyNoSalesFilter, applySalesLessThanFilter, salesLessThanUnits, applyDisposedFilter]);

  const lowStockProducts = useMemo(() => {
    return inventory.filter(p => p.quantity <= (p.lowStockThreshold || 10));
  }, [inventory]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-[280px]" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 bg-muted/40 min-h-screen">
      {/* Header and Date Filter */}
      <div className="min-h-[80px]">
        {['revenue', 'customer'].includes(activeTab) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tổng quan Kinh doanh</h1>
              <p className="text-muted-foreground">Báo cáo tổng quan về tình hình kinh doanh của bạn.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-full sm:w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.startDate ? (
                      filter.endDate ? (
                        <>
                          {format(filter.startDate, "dd/MM/y", { locale: vi })} - {format(filter.endDate, "dd/MM/y", { locale: vi })}
                        </>
                      ) : (
                        format(filter.startDate, "dd/MM/y", { locale: vi })
                      )
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filter.startDate || new Date()}
                    selected={{ from: filter.startDate || undefined, to: filter.endDate || undefined }}
                    onSelect={handleDateChange}
                    numberOfMonths={isMobile ? 1 : 2}
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              <div className="grid grid-cols-2 md:flex gap-2">
                <Button onClick={() => setDateRangePreset('today')} variant="outline" size="sm" className="text-xs md:text-sm">Hôm nay</Button>
                <Button onClick={() => setDateRangePreset('last_7_days')} variant="outline" size="sm" className="text-xs md:text-sm">7 ngày</Button>
                <Button onClick={() => setDateRangePreset('last_30_days')} variant="outline" size="sm" className="text-xs md:text-sm">30 ngày</Button>
                <Button onClick={() => setDateRangePreset('this_month')} variant="outline" size="sm" className="text-xs md:text-sm">Tháng này</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          title="Tổng Doanh thu"
          value={`${kpiData.totalRevenue.toLocaleString('vi-VN')} VNĐ`}
          icon={<DollarSign className="h-6 w-6" />}
          colorClassName="bg-blue-600 text-white"
        />
        <KpiCard
          title="Tổng Lợi nhuận"
          value={`${kpiData.totalProfit.toLocaleString('vi-VN')} VNĐ`}
          icon={<TrendingUp className="h-6 w-6" />}
          colorClassName="bg-green-600 text-white"
        />
        <KpiCard
          title="Tỷ suất Lợi nhuận"
          value={`${kpiData.profitMargin.toFixed(2)}%`}
          icon={<ShoppingBag className="h-6 w-6" />}
          colorClassName="bg-orange-500 text-white"
        />
        <KpiCard
          title="Tổng Hóa đơn"
          value={kpiData.totalInvoices}
          icon={<FileText className="h-6 w-6" />}
          colorClassName="bg-purple-600 text-white"
        />
      </div>

      <div className="space-y-8">
        <Tabs defaultValue="revenue" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Phân tích Doanh thu & Lợi nhuận</TabsTrigger>
            <TabsTrigger value="product">Phân tích Sản phẩm</TabsTrigger>
            <TabsTrigger value="customer">Phân tích Hành vi Khách hàng</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue">
            <div className="space-y-6 mt-4">
                <RevenueProfitTrendChart data={trendData} viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
          </TabsContent>
          <TabsContent value="product">
            <div className="space-y-6 mt-4">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TopSellingProductsTable data={topSellingProducts} />
                </div>
                <div>
                  <TopSellingFilter
                    dateRange={topSellingDateRange}
                    onDateChange={setTopSellingDateRange}
                    topN={topN}
                    onTopNChange={setTopN}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SlowSellingProductsTable data={slowSellingProducts.slice(0, 10)} />
                </div>
                <div>
                  <SlowMovingFilter
                    dateRange={slowMovingDateRange}
                    onDateChange={setSlowMovingDateRange}
                    applyNoSalesFilter={applyNoSalesFilter}
                    onApplyNoSalesFilterChange={setApplyNoSalesFilter}
                    applySalesLessThanFilter={applySalesLessThanFilter}
                    onApplySalesLessThanFilterChange={setApplySalesLessThanFilter}
                    salesLessThanUnits={salesLessThanUnits}
                    onSalesLessThanUnitsChange={setSalesLessThanUnits}
                    applyDisposedFilter={applyDisposedFilter}
                    onApplyDisposedFilterChange={setApplyDisposedFilter}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="customer">
            <div className="space-y-6 mt-4">
              <CustomerAnalysisReport customerInsights={customerInsights} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}