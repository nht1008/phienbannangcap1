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
             <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs md:text-sm" onClick={() => setIsRedemptionInfoOpen(true)}>
                    <Coins className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Đổi điểm lấy tiền</span>
                    <span className="sm:hidden">Đổi điểm</span>
                </Button>
                <Dialog open={isRankInfoOpen} onOpenChange={setIsRankInfoOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs md:text-sm">
                    <HelpCircle className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Thông Tin Hạng</span>
                    <span className="sm:hidden">Hạng</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="mobile-dialog-content sm:max-w-4xl max-w-[95vw] max-h-[85vh] sm:max-h-[95vh] flex flex-col p-0">
                 <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0 border-b">
                   <DialogTitle className="text-lg md:text-xl">Thông Tin Chi Tiết Các Hạng</DialogTitle>
                   <DialogDescription className="text-sm">
                     Thông tin chi tiết về các hạng và ưu đãi tương ứng.
                   </DialogDescription>
                 </DialogHeader>
                 
                 {/* Desktop Table View */}
                 <div className="hidden md:block flex-1 overflow-hidden px-4 sm:px-6">
                   <div className="h-full overflow-y-auto border rounded-lg">
                     <Table>
                       <TableHeader className="sticky top-0 bg-background z-10 border-b">
                         <TableRow>
                           <TableHead className="text-sm font-semibold">Hạng</TableHead>
                           <TableHead className="text-sm font-semibold">Mức Chi Tiêu (VNĐ)</TableHead>
                           <TableHead className="text-sm font-semibold">Ưu đãi (%)</TableHead>
                           <TableHead className="text-sm font-semibold">Hạn chế</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {Object.entries(TIERS).map(([tier, data]) => (
                           <TableRow key={tier} className={getVipTierStyling(tier)}>
                             <TableCell className="font-bold text-sm">{tier}</TableCell>
                             <TableCell className="text-sm">
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
                             <TableCell className="text-sm font-semibold text-green-600">{(data.discount * 100).toFixed(0)}%</TableCell>
                             <TableCell className="text-sm">
                               <div className="font-medium">{data.usageLimit}</div>
                               {data.minOrder > 0 && (
                                 <div className="text-xs text-muted-foreground mt-1">
                                   Áp dụng cho đơn từ {data.minOrder.toLocaleString('vi-VN')} VNĐ
                                 </div>
                               )}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 </div>

                 {/* Mobile Card View */}
                 <div className="md:hidden flex-1 min-h-0 px-4 pb-6">
                   <div className="mobile-scroll-area dialog-scroll-container">
                     <div className="space-y-3 py-2">
                       {Object.entries(TIERS).map(([tier, data]) => (
                         <Card key={tier} className={cn("border-l-4 shadow-sm", getVipTierStyling(tier))}>
                           <CardContent className="p-3">
                             <div className="space-y-2">
                               <div className="flex justify-between items-start">
                                 <h3 className="font-bold text-base">{tier}</h3>
                                 <span className="text-base font-bold text-green-600 shrink-0">{(data.discount * 100).toFixed(0)}% OFF</span>
                               </div>
                               
                               <div className="grid gap-2">
                                 <div className="bg-muted/30 p-2 rounded">
                                   <p className="text-xs text-muted-foreground mb-1">Mức chi tiêu yêu cầu:</p>
                                   <p className="font-semibold text-sm leading-tight">
                                     {
                                       tier === 'Vô danh' ? 'Dưới 5,000,000 VNĐ' :
                                       tier === 'Đầy tớ' ? '5,000,000 - 9,999,999 VNĐ' :
                                       tier === 'Nông dân' ? '10,000,000 - 19,999,999 VNĐ' :
                                       tier === 'Chủ đồn điền' ? '20,000,000 - 39,999,999 VNĐ' :
                                       tier === 'Thương gia' ? '40,000,000 - 69,999,999 VNĐ' :
                                       tier === 'Phú ông' ? '70,000,000 - 99,999,999 VNĐ' :
                                       '100,000,000 VNĐ trở lên'
                                     }
                                   </p>
                                 </div>
                                 
                                 <div className="bg-green-50 p-2 rounded border border-green-200">
                                   <p className="text-xs text-green-700 mb-1">Ưu đãi giảm giá:</p>
                                   <p className="font-bold text-green-800">{(data.discount * 100).toFixed(0)}%</p>
                                 </div>
                                 
                                 <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                   <p className="text-xs text-blue-700 mb-1">Hạn chế sử dụng:</p>
                                   <p className="font-semibold text-blue-800 text-sm leading-tight">{data.usageLimit}</p>
                                   {data.minOrder > 0 && (
                                     <p className="text-xs text-blue-600 mt-1 leading-tight">
                                       ⚠️ Áp dụng cho đơn từ {data.minOrder.toLocaleString('vi-VN')} VNĐ
                                     </p>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                       {/* Extra padding to ensure last item is visible */}
                       <div className="h-4"></div>
                     </div>
                   </div>
                 </div>
               </DialogContent>
             </Dialog>
            </div>
           </div>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboardData.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 text-sm md:text-base">
                Chưa có dữ liệu chi tiêu của khách hàng để lập bảng xếp hạng.
              </p>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
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
                              "animate-fadeInUp overflow-hidden",
                              getVipTierStyling(customer.vipTier),
                              isTopThree && "border-l-4 border-l-yellow-500 shadow-lg"
                            )}
                            style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <RankBadge rank={customer.rank} />
                                  <div>
                                    <h3 className={cn("font-bold", isTopThree ? "text-lg" : "text-base")}>{customer.name}</h3>
                                    <VipTierBadge tier={customer.vipTier} />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Tổng chi tiêu:</span>
                                  <span className={cn("font-bold text-primary", isTopThree ? "text-lg" : "text-base")}>
                                    {customer.totalSpent.toLocaleString('vi-VN')} VNĐ
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
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </>
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
          </div>
          <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Đóng</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
