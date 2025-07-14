"use client";

import React, { useMemo, useState, useEffect } from 'react';
import type { Customer, Invoice, Debt, DebtPayment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, HelpCircle } from 'lucide-react';
import { cn, normalizeStringForSearch } from '@/lib/utils';
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
}

interface LeaderboardEntry extends Customer {
  totalSpent: number;
  rank: number;
  purchaseCount: number;
  firstPurchaseDate: string | null;
  vipTier: string;
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

export function LeaderboardTab({ customers, invoices, debts }: LeaderboardTabProps) {
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


  return (
    <>
      {width && height && leaderboardData.length > 0 && <Confetti width={width} height={height} recycle={true} numberOfPieces={50} />}
      <div className="p-4 md:p-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-3xl font-bold flex items-center">
              <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
              Vinh Danh Đại Gia
            </CardTitle>
           <div className="flex justify-between items-center">
             <CardDescription className="text-base">
               Vinh danh những khách hàng thân thiết có chi tiêu cao nhất.
             </CardDescription>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setIsRedemptionInfoOpen(true)}>
                    <Coins className="h-4 w-4" />
                    Đổi điểm lấy tiền
                </Button>
                <Dialog open={isRankInfoOpen} onOpenChange={setIsRankInfoOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Thông Tin Hạng
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                 <DialogHeader>
                   <DialogTitle>Thông Tin Chi Tiết Các Hạng</DialogTitle>
                   <DialogDescription>
                     Thông tin chi tiết về các hạng và ưu đãi tương ứng.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="grid gap-4 py-4">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Hạng</TableHead>
                         <TableHead>Mức Chi Tiêu (VNĐ)</TableHead>
                         <TableHead>Ưu đãi</TableHead>
                         <TableHead>Hạn chế</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                        {Object.entries(TIERS).map(([tier, data]) => (
                          <TableRow key={tier} className={getVipTierStyling(tier)}>
                            <TableCell className="font-bold">{tier}</TableCell>
                            <TableCell>
                              {
                                tier === 'Vô danh' ? 'Dưới 5,000,000' :
                                tier === 'Đầy tớ' ? '5,000,000 - 9,999,999' :
                                tier === 'Nông dân' ? '10,000,000 - 19,999,999' :
                                tier === 'Chủ đồn điền' ? '20,000,000 - 39,999,999' :
                                tier === 'Thương gia' ? '40,000,000 - 69,999,999' :
                                tier === 'Phú ông' ? '70,000,000 - 99,999,999' :
                                '100,000,000 trở lên'
                              }
                            </TableCell>
                            <TableCell>{(data.discount * 100).toFixed(0)}%</TableCell>
                            <TableCell>
                              <div>{data.usageLimit}</div>
                              {data.minOrder > 0 && (
                                <div className="text-xs opacity-80">
                                  (Áp dụng cho đơn từ {data.minOrder.toLocaleString('vi-VN')} VNĐ)
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                   </Table>
                 </div>
               </DialogContent>
             </Dialog>
            </div>
           </div>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboardData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                Chưa có dữ liệu chi tiêu của khách hàng để lập bảng xếp hạng.
              </p>
            ) : (
              <ScrollArea className="h-[70vh] no-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center text-lg">Hạng</TableHead>
                      <TableHead className="text-lg">Tên Khách Hàng</TableHead>
                      <TableHead>Hạng</TableHead>
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
                            getVipTierStyling(customer.vipTier)
                          )}
                          style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
                        >
                          <TableCell className="flex justify-center items-center p-2">
                            <RankBadge rank={customer.rank} />
                          </TableCell>
                          <TableCell className={cn("text-lg", isTopThree ? "text-xl" : "font-medium")}>
                            {customer.name}
                          </TableCell>
                          <TableCell>
                            <VipTierBadge tier={customer.vipTier} />
                          </TableCell>
                          <TableCell className={cn("text-right text-lg font-semibold", isTopThree ? "text-xl" : "text-primary")}>
                            {customer.totalSpent.toLocaleString('vi-VN')} VNĐ
                          </TableCell>
                           <TableCell className="text-center">{customer.purchaseCount}</TableCell>
                           <TableCell>
                            {customer.firstPurchaseDate ? new Date(customer.firstPurchaseDate).toLocaleDateString('vi-VN') : 'N/A'}
                           </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <RedemptionInfoDialog 
        isOpen={isRedemptionInfoOpen} 
        onOpenChange={setIsRedemptionInfoOpen}
      />
    </>
  );
}

interface RedemptionInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function RedemptionInfoDialog({ isOpen, onOpenChange }: RedemptionInfoDialogProps) {
  const getVipTierStyling = (tier: string) => {
    switch (tier) {
      case 'Đại gia': return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'Phú ông': return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white';
      case 'Thương gia': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'Chủ đồn điền': return 'bg-gradient-to-r from-green-500 to-lime-500 text-white';
      case 'Nông dân': return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 'Đầy tớ': return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
      default: return 'bg-stone-500 to-neutral-500 text-white';
    }
  };

  const getMilestoneBackgroundColor = (points: number) => {
    const colors = [
      'bg-green-100',
      'bg-green-200',
      'bg-green-300',
      'bg-green-400',
      'bg-green-500',
      'bg-green-600',
    ];
    const index = REDEMPTION_OPTIONS.findIndex(option => option.points === points);
    return colors[index] || 'bg-gray-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
              <DialogTitle>Thông tin đổi điểm</DialogTitle>
              <DialogDescription>
                  Quy tắc và các mốc đổi điểm thưởng.
              </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div>
                  <h3 className="font-semibold mb-2">Quy tắc tích điểm</h3>
                  <p>Tỷ lệ quy đổi: <span className="font-mono bg-muted px-2 py-1 rounded">{1 / POINT_CONVERSION_RATE} VNĐ</span> chi tiêu = <span className="font-mono bg-muted px-2 py-1 rounded">1 điểm</span>.</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-2">Hệ số nhân theo hạng</h3>
                    <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Hạng</TableHead>
                           <TableHead>Hệ số nhân</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                          {Object.entries(TIER_POINT_MULTIPLIERS).map(([tier, multiplier]) => (
                            <TableRow key={tier} className={getVipTierStyling(tier)}>
                              <TableCell className="font-bold">{tier}</TableCell>
                              <TableCell>x{multiplier}</TableCell>
                            </TableRow>
                          ))}
                       </TableBody>
                     </Table>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Các mốc đổi thưởng</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {REDEMPTION_OPTIONS.map((option) => (
                            <div key={option.points} className={cn(
                                "p-4 rounded-lg text-center transition-all duration-300",
                                getMilestoneBackgroundColor(option.points)
                            )}>
                                <p className="text-lg font-bold text-gray-800">{option.value.toLocaleString('vi-VN')} VNĐ</p>
                                <p className="text-sm text-gray-600">({option.points.toLocaleString('vi-VN')} điểm)</p>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
          </div>
          <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
