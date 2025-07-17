"use client";

import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Invoice, Debt, DebtPayment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, HelpCircle, Crown, Coins as CoinsIcon, Calendar } from 'lucide-react';
import { cn, normalizeStringForSearch, formatCurrencyForUser, formatCurrencyForLeaderboard } from '@/lib/utils';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import RankBadge from '@/components/shared/RankBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { TIERS } from '@/lib/tiers';
import { REDEMPTION_OPTIONS, POINT_CONVERSION_RATE, TIER_POINT_MULTIPLIERS } from '@/lib/points';
import { Separator } from '@/components/ui/separator';
import { Coins } from 'lucide-react';
import VipTierBadge from '@/components/shared/VipTierBadge';

interface LeaderboardTabProps {
  customers: Customer[];
  invoices: Invoice[];
  debts: Debt[];
  isCurrentUserCustomer?: boolean;
}

interface LeaderboardEntry extends Customer {
  totalSpent: number;
  rank: number;
  purchaseCount: number;
  firstPurchaseDate: string | null;
  vipTier: string;
}

interface PointsLeaderboardEntry extends Customer {
  totalPoints: number;
  rank: number;
  earnedPoints: number;
  spentPoints: number;
}

interface MonthlySpendingEntry extends Customer {
  monthlySpent: number;
  rank: number;
  monthlyPurchaseCount: number;
}

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<{width: number | undefined, height: number | undefined}>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []); 

  return windowSize;
}

export function LeaderboardTab({ customers, invoices, debts, isCurrentUserCustomer = false }: LeaderboardTabProps) {
  const { width, height } = useWindowSize();
  const [isRankInfoOpen, setIsRankInfoOpen] = useState(false);
  const [isRedemptionInfoOpen, setIsRedemptionInfoOpen] = useState(false);

  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    const spendingMap = new Map<string, { totalSpent: number; purchaseCount: number; firstPurchaseDate: string | null; }>();
    
    // Tính chi tiêu từ hóa đơn (chỉ phần đã thanh toán)
    invoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName !== 'khachle') {
        if (!spendingMap.has(normalizedName)) {
          spendingMap.set(normalizedName, {
            totalSpent: 0,
            purchaseCount: 0,
            firstPurchaseDate: invoice.date,
          });
        }
        const customerData = spendingMap.get(normalizedName)!;
        // Chỉ tính số tiền đã thanh toán thực tế, không tính số tiền nợ
        const paidAmount = invoice.amountPaid || 0;
        customerData.totalSpent += paidAmount;
        customerData.purchaseCount += 1;
      }
    });

    // Không tính thêm thanh toán công nợ vào tổng chi tiêu
    // vì thanh toán nợ chỉ là việc thanh toán các khoản nợ từ hóa đơn trước đó đã được tính

    const getVipTier = (totalSpent: number): string => {
        if (totalSpent >= 100000000) return 'Đại gia';
        if (totalSpent >= 70000000) return 'Phú ông';
        if (totalSpent >= 40000000) return 'Thương gia';
        if (totalSpent >= 20000000) return 'Chủ đồn điền';
        if (totalSpent >= 10000000) return 'Nông dân';
        if (totalSpent >= 5000000) return 'Đầy tớ';
        return 'Vô danh';
    }

    const rankedCustomers = customers
      .map(customer => {
        const normalizedName = normalizeStringForSearch(customer.name);
        const customerStats = spendingMap.get(normalizedName) || { totalSpent: 0, purchaseCount: 0, firstPurchaseDate: null };
        
        return {
          ...customer,
          totalSpent: customerStats.totalSpent,
          purchaseCount: customerStats.purchaseCount,
          firstPurchaseDate: customerStats.firstPurchaseDate,
          vipTier: getVipTier(customerStats.totalSpent),
        };
      })
      .filter(customer => customer.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 50)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1,
      }));

    return rankedCustomers;
  }, [customers, invoices, debts]);

  // Bảng xếp hạng theo điểm thưởng
  const pointsLeaderboardData = useMemo((): PointsLeaderboardEntry[] => {
    const rankedCustomers = customers
      .map(customer => {
        const totalPoints = customer.points || 0;
        const pointsHistory = Array.isArray(customer.pointsHistory) ? customer.pointsHistory : [];
        
        const earnedPoints = pointsHistory
          .filter(entry => entry && entry.reason === 'earn')
          .reduce((sum, entry) => sum + (entry.points || 0), 0);
        
        const spentPoints = pointsHistory
          .filter(entry => entry && entry.reason === 'redeem')
          .reduce((sum, entry) => sum + Math.abs(entry.points || 0), 0);
        
        return {
          ...customer,
          totalPoints,
          earnedPoints,
          spentPoints,
        };
      })
      .filter(customer => customer.totalPoints > 0 || customer.earnedPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 50)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1,
      }));

    return rankedCustomers;
  }, [customers]);

  // Bảng xếp hạng chi tiêu tháng hiện tại  
  const monthlySpendingData = useMemo((): MonthlySpendingEntry[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    });

    const monthlySpendingMap = new Map<string, { monthlySpent: number; monthlyPurchaseCount: number }>();

    monthlyInvoices.forEach(invoice => {
      const normalizedName = normalizeStringForSearch(invoice.customerName);
      if (normalizedName && normalizedName !== 'khachle') {
        if (!monthlySpendingMap.has(normalizedName)) {
          monthlySpendingMap.set(normalizedName, {
            monthlySpent: 0,
            monthlyPurchaseCount: 0,
          });
        }
        const customerData = monthlySpendingMap.get(normalizedName)!;
        const paidAmount = invoice.amountPaid || 0;
        customerData.monthlySpent += paidAmount;
        customerData.monthlyPurchaseCount += 1;
      }
    });

    const rankedCustomers = customers
      .map(customer => {
        const normalizedName = normalizeStringForSearch(customer.name);
        const monthlyStats = monthlySpendingMap.get(normalizedName) || { monthlySpent: 0, monthlyPurchaseCount: 0 };
        
        return {
          ...customer,
          monthlySpent: monthlyStats.monthlySpent,
          monthlyPurchaseCount: monthlyStats.monthlyPurchaseCount,
        };
      })
      .filter(customer => customer.monthlySpent > 0)
      .sort((a, b) => b.monthlySpent - a.monthlySpent)
      .slice(0, 50)
      .map((customer, index) => ({
        ...customer,
        rank: index + 1,
      }));

    return rankedCustomers;
  }, [customers, invoices]);

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
        return 'bg-gradient-to-r from-stone-500 to-neutral-500 text-white shadow-lg border-stone-300 hover:bg-gradient-to-r hover:from-stone-600 hover:to-neutral-600';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Render bảng xếp hạng chi tiêu tổng
  const renderSpendingLeaderboard = () => {
    if (leaderboardData.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10 text-sm md:text-base">
          Chưa có dữ liệu chi tiêu của khách hàng để lập bảng xếp hạng.
        </p>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center text-lg">Hạng</TableHead>
                  <TableHead className="text-lg">Tên Khách Hàng</TableHead>
                  <TableHead>Hạng VIP</TableHead>
                  <TableHead className="text-right text-lg">Tổng Chi Tiêu</TableHead>
                  <TableHead className="text-center">Số Lần Mua</TableHead>
                  <TableHead>Ngày Đầu Mua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((customer, index) => {
                  const isTopThree = customer.rank <= 3;
                  return (
                    <TableRow 
                      key={customer.id} 
                      className={cn(
                        "animate-fadeInUp group",
                        isTopThree && "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400"
                      )}
                    >
                      <TableCell className="text-center">
                        <RankBadge rank={customer.rank} />
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <VipTierBadge tier={customer.vipTier} />
                      </TableCell>
                      <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl" : "text-primary")}>
                        {formatCurrencyForLeaderboard(customer.totalSpent, isCurrentUserCustomer)}
                      </TableCell>
                      <TableCell className="text-center">{customer.purchaseCount}</TableCell>
                      <TableCell>
                        {customer.firstPurchaseDate ? new Date(customer.firstPurchaseDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-2">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <div className="space-y-3">
              {leaderboardData.map((customer, index) => {
                const isTopThree = customer.rank <= 3;
                return (
                  <Card 
                    key={customer.id} 
                    className={cn(
                      "border-l-4 transition-all duration-300 animate-fadeInUp group",
                      isTopThree && "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-md"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <RankBadge rank={customer.rank} />
                          <div>
                            <h3 className="font-semibold text-base">{customer.name}</h3>
                            <VipTierBadge tier={customer.vipTier} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tổng chi tiêu:</span>
                          <span className={cn("font-bold text-primary", isTopThree ? "text-lg" : "text-base")}>
                            {formatCurrencyForLeaderboard(customer.totalSpent, isCurrentUserCustomer)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Số lần mua: </span>
                            <span className="font-medium">{customer.purchaseCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ngày đầu: </span>
                            <span className="font-medium">
                              {customer.firstPurchaseDate ? new Date(customer.firstPurchaseDate).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  };

  // Render bảng xếp hạng điểm thưởng
  const renderPointsLeaderboard = () => {
    if (pointsLeaderboardData.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10 text-sm md:text-base">
          Chưa có dữ liệu điểm thưởng để lập bảng xếp hạng.
        </p>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center text-lg">Hạng</TableHead>
                  <TableHead className="text-lg">Tên Khách Hàng</TableHead>
                  <TableHead className="text-right text-lg">Điểm Hiện Tại</TableHead>
                  <TableHead className="text-right">Điểm Đã Tích</TableHead>
                  <TableHead className="text-right">Điểm Đã Dùng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointsLeaderboardData.map((customer, index) => {
                  const isTopThree = customer.rank <= 3;
                  return (
                    <TableRow 
                      key={customer.id} 
                      className={cn(
                        "animate-fadeInUp group",
                        isTopThree && "bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400"
                      )}
                    >
                      <TableCell className="text-center">
                        <RankBadge rank={customer.rank} />
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {customer.name}
                      </TableCell>
                      <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl text-purple-600" : "text-primary")}>
                        {customer.totalPoints.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {customer.earnedPoints.toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {customer.spentPoints.toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-2">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <div className="space-y-3">
              {pointsLeaderboardData.map((customer, index) => {
                const isTopThree = customer.rank <= 3;
                return (
                  <Card 
                    key={customer.id} 
                    className={cn(
                      "border-l-4 transition-all duration-300 animate-fadeInUp group",
                      isTopThree && "border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-md"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <RankBadge rank={customer.rank} />
                          <div>
                            <h3 className="font-semibold text-base">{customer.name}</h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Điểm hiện tại:</span>
                          <span className={cn("font-bold", isTopThree ? "text-lg text-purple-600" : "text-base text-primary")}>
                            {customer.totalPoints.toLocaleString('vi-VN')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Đã tích: </span>
                            <span className="font-medium text-green-600">{customer.earnedPoints.toLocaleString('vi-VN')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Đã dùng: </span>
                            <span className="font-medium text-red-600">{customer.spentPoints.toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  };

  // Render bảng xếp hạng chi tiêu tháng
  const renderMonthlyLeaderboard = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (monthlySpendingData.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-10 text-sm md:text-base">
          Chưa có dữ liệu chi tiêu tháng {currentMonth}/{currentYear} để lập bảng xếp hạng.
        </p>
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center text-lg">Hạng</TableHead>
                  <TableHead className="text-lg">Tên Khách Hàng</TableHead>
                  <TableHead className="text-right text-lg">Chi Tiêu Tháng {currentMonth}</TableHead>
                  <TableHead className="text-center">Số Lần Mua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySpendingData.map((customer, index) => {
                  const isTopThree = customer.rank <= 3;
                  return (
                    <TableRow 
                      key={customer.id} 
                      className={cn(
                        "animate-fadeInUp group",
                        isTopThree && "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400"
                      )}
                    >
                      <TableCell className="text-center">
                        <RankBadge rank={customer.rank} />
                      </TableCell>
                      <TableCell className="font-medium text-base">
                        {customer.name}
                      </TableCell>
                      <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl text-green-600" : "text-primary")}>
                        {formatCurrencyForLeaderboard(customer.monthlySpent, isCurrentUserCustomer)}
                      </TableCell>
                      <TableCell className="text-center">{customer.monthlyPurchaseCount}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-2">
          <ScrollArea className="h-[70vh] no-scrollbar">
            <div className="space-y-3">
              {monthlySpendingData.map((customer, index) => {
                const isTopThree = customer.rank <= 3;
                return (
                  <Card 
                    key={customer.id} 
                    className={cn(
                      "border-l-4 transition-all duration-300 animate-fadeInUp group",
                      isTopThree && "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <RankBadge rank={customer.rank} />
                          <div>
                            <h3 className="font-semibold text-base">{customer.name}</h3>
                            <p className="text-xs text-muted-foreground">Tháng {currentMonth}/{currentYear}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Chi tiêu tháng:</span>
                          <span className={cn("font-bold", isTopThree ? "text-lg text-green-600" : "text-base text-primary")}>
                            {formatCurrencyForLeaderboard(customer.monthlySpent, isCurrentUserCustomer)}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">Số lần mua: </span>
                          <span className="font-medium">{customer.monthlyPurchaseCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </>
    );
  };

  return (
    <>
      {width && height && leaderboardData.length > 0 && <Confetti width={width} height={height} recycle={true} numberOfPieces={50} />}
      <div className="p-2 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 p-4 md:p-6">
            <CardTitle className="text-xl md:text-3xl font-bold flex items-center">
              <Trophy className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              <span className="hidden sm:inline">Vinh Danh Đại Gia</span>
              <span className="sm:hidden">Bảng Xếp Hạng</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <CardDescription className="text-sm md:text-base">
                Vinh danh những khách hàng thân thiết có chi tiêu cao nhất.
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Dialog open={isRankInfoOpen} onOpenChange={setIsRankInfoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs md:h-9 md:text-sm">
                      <HelpCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="hidden md:inline">Hạng VIP</span>
                      <span className="md:hidden">VIP</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="text-left">
                      <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <Crown className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                        Hệ Thống Hạng VIP
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm md:text-base text-muted-foreground">
                        Khách hàng được xếp hạng dựa trên tổng chi tiêu tích lũy:
                      </div>
                      <div className="grid gap-3">
                        {Object.entries(TIERS).map(([tierName, tierInfo]) => (
                          <div key={tierName} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "px-3 py-1 rounded-full text-xs md:text-sm font-medium border",
                                getVipTierStyling(tierName)
                              )}>
                                {tierName}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm md:text-base font-semibold">
                                {tierName === 'Vô danh' ? '0₫' : 
                                 tierName === 'Đầy tớ' ? '5,000,000₫' :
                                 tierName === 'Nông dân' ? '10,000,000₫' :
                                 tierName === 'Chủ đồn điền' ? '20,000,000₫' :
                                 tierName === 'Thương gia' ? '40,000,000₫' :
                                 tierName === 'Phú ông' ? '70,000,000₫' :
                                 tierName === 'Đại gia' ? '100,000,000₫' : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Hệ số điểm: x{TIER_POINT_MULTIPLIERS[tierName] || 1}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRedemptionInfoOpen} onOpenChange={setIsRedemptionInfoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs md:h-9 md:text-sm">
                      <Coins className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="hidden md:inline">Điểm Thưởng</span>
                      <span className="md:hidden">Điểm</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="text-left">
                      <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <CoinsIcon className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                        Hệ Thống Điểm Thưởng
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm md:text-base mb-2">📈 Cách Tích Điểm</h4>
                          <div className="text-sm md:text-base text-muted-foreground">
                            • Mỗi <span className="font-medium">{formatCurrencyForUser(POINT_CONVERSION_RATE)}</span> chi tiêu = 1 điểm
                            <br />• Điểm được nhân với hệ số hạng VIP
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold text-sm md:text-base mb-3">🎁 Quy Đổi Điểm</h4>
                          <div className="grid gap-3">
                            {REDEMPTION_OPTIONS.map((option, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">🎁</span>
                                  <div>
                                    <div className="font-medium text-sm md:text-base">
                                      Phiếu giảm giá {formatCurrencyForUser(option.value)}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">
                                      Áp dụng cho đơn từ {formatCurrencyForUser(option.minOrder)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-sm md:text-base text-primary">
                                    {option.points.toLocaleString('vi-VN')} điểm
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ≈ {formatCurrencyForUser(option.value)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="spending" className="w-full">
              <div className="border-b px-4 md:px-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-transparent">
                  <TabsTrigger 
                    value="spending" 
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 text-xs md:text-sm data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                  >
                    <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                    Chi Tiêu Tổng
                  </TabsTrigger>
                  <TabsTrigger 
                    value="points" 
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 text-xs md:text-sm data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                  >
                    <CoinsIcon className="h-3 w-3 md:h-4 md:w-4" />
                    Điểm Thưởng
                  </TabsTrigger>
                  <TabsTrigger 
                    value="monthly" 
                    className="flex items-center gap-1 md:gap-2 px-3 py-2 text-xs md:text-sm data-[state=active]:bg-muted data-[state=active]:shadow-sm"
                  >
                    <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                    Tháng Này
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="spending" className="mt-0">
                {renderSpendingLeaderboard()}
              </TabsContent>

              <TabsContent value="points" className="mt-0">
                {renderPointsLeaderboard()}
              </TabsContent>

              <TabsContent value="monthly" className="mt-0">
                {renderMonthlyLeaderboard()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}