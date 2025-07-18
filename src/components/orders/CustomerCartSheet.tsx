
"use client";

import React, { useState, useEffect } from 'react';
import type { CartItem, Product, Invoice } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, Pencil, MessageSquare, Star } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from '@/lib/utils';
import { calculateDiscount } from '@/lib/tiers';
import { RedeemPointsDialog } from '@/components/points/RedeemPointsDialog';
import VipTierBadge from '@/components/shared/VipTierBadge';
import type { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatCompactCurrency } from '@/lib/utils';
import { DEFAULT_BANK_ACCOUNT, generateBankQRContent, generatePaymentDescription } from '@/lib/sepay';

interface CustomerCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cart: CartItem[];
  customer: Customer | null;
  onUpdateQuantity: (itemId: string, newQuantity: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: (discountAmount: number, redeemedPoints?: {points: number, value: number}) => Promise<string>; // Now returns orderId
  inventory: Product[];
  invoices: Invoice[];
  onOpenNoteEditor: (itemId: string) => void;
}

export function CustomerCartSheet({
  isOpen,
  onOpenChange,
  cart,
  customer,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  inventory,
  invoices,
  onOpenNoteEditor,
}: CustomerCartSheetProps) {

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantityInCart, 0);
  const [appliedTierDiscount, setAppliedTierDiscount] = useState({ amount: 0, percentage: 0 });
  const [tierDiscountInfo, setTierDiscountInfo] = useState<{ remaining?: number; period?: string }>({});
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState({ points: 0, value: 0 });
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setRedeemedPoints({ points: 0, value: 0 });
      setAppliedTierDiscount({ amount: 0, percentage: 0 });
      setTierDiscountInfo({});
      setIsQRDialogOpen(false);
      setCurrentOrderId(null);
      setOrderCreated(false);
    }
  }, [isOpen]);

  const handleApplyTierDiscount = () => {
    if (redeemedPoints.value > 0) {
      toast({ title: "Lỗi", description: "Không thể áp dụng ưu đãi hạng khi đã đổi điểm.", variant: "destructive" });
      return;
    }
    if (customer) {
      const result = calculateDiscount(customer, totalAmount, invoices);
      setTierDiscountInfo({ remaining: result.remainingUses, period: result.usagePeriod });
      if (result.success) {
        setAppliedTierDiscount({ amount: result.discountAmount, percentage: result.discountPercentage });
        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        });
      } else {
        setAppliedTierDiscount({ amount: 0, percentage: 0 });
        toast({
          title: "Không thể áp dụng",
          description: result.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Chưa có khách hàng",
        description: "Vui lòng đăng nhập để áp dụng ưu đãi.",
        variant: "destructive",
      });
    }
  };

  const handleCancelTierDiscount = () => {
    setAppliedTierDiscount({ amount: 0, percentage: 0 });
    setTierDiscountInfo({});
    toast({
      title: "Đã hủy",
      description: "Đã hủy bỏ ưu đãi cấp bậc.",
      variant: "default",
    });
  };

  const handleRedeem = (points: number, value: number) => {
    if (appliedTierDiscount.amount > 0) {
      toast({ title: "Lỗi", description: "Không thể đổi điểm khi đang áp dụng ưu đãi hạng.", variant: "destructive" });
      return;
    }
    
    // Ensure points and value are valid numbers
    if (typeof points !== 'number' || typeof value !== 'number' || points <= 0 || value <= 0) {
      toast({ title: "Lỗi", description: "Dữ liệu điểm không hợp lệ.", variant: "destructive" });
      return;
    }
    
    setRedeemedPoints({ points, value });
    setIsRedeemDialogOpen(false);
    toast({ title: "Thành công", description: `Đã đổi ${points} điểm để được giảm ${formatCompactCurrency(value)}.` });
  };

  const handleCancelRedemption = () => {
    setRedeemedPoints({ points: 0, value: 0 });
    toast({
      title: "Đã hủy",
      description: "Đã hủy bỏ đổi điểm.",
      variant: "default",
    });
  };
 
  const handlePlaceOrder = async () => {
    if (!orderCreated) {
      try {
        // Create order first and get the orderId
        const redeemedPointsData = redeemedPoints && 
                                  typeof redeemedPoints.points === 'number' && 
                                  typeof redeemedPoints.value === 'number' && 
                                  redeemedPoints.points > 0 && 
                                  redeemedPoints.value > 0 ? {
          points: redeemedPoints.points,
          value: redeemedPoints.value
        } : undefined;
        
        const orderId = await onPlaceOrder(
          appliedTierDiscount.amount > 0 ? appliedTierDiscount.amount : (redeemedPoints?.value || 0), 
          redeemedPointsData
        );
        
        setCurrentOrderId(orderId);
        setOrderCreated(true);
        toast({ 
          title: "Đơn hàng đã tạo", 
          description: `Mã đơn hàng: ${orderId}. Vui lòng thanh toán để hoàn tất.`,
          duration: 3000
        });
      } catch (error) {
        toast({ 
          title: "Lỗi", 
          description: "Không thể tạo đơn hàng. Vui lòng thử lại.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }
    setIsQRDialogOpen(true);
  };
  
  const finalTotal = totalAmount - appliedTierDiscount.amount - redeemedPoints.value;
  
  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-5xl">
        <SheetHeader className="px-4 sm:px-6 pt-6">
          <div className="flex flex-col space-y-3">
            {/* Title Row */}
            <SheetTitle className="flex items-center gap-3 text-xl sm:text-2xl">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Giỏ hàng của bạn</span>
              {customer && <VipTierBadge tier={customer.tier || 'Vô danh'} className="text-xs sm:text-sm" />}
            </SheetTitle>
            
            {/* Customer Info Row - Mobile Optimized */}
            {customer && (
              <div className="flex flex-col gap-3 p-3 rounded-lg border bg-muted/50">
                {/* Points Display Row */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center text-sm sm:text-base">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-500" />
                    <span className="font-bold">
                      {redeemedPoints.points > 0 ? (
                        <>
                          <span className="line-through">{customer.points?.toLocaleString('vi-VN') || 0}</span>
                          <span className="mx-1">→</span>
                          <span>{((customer.points || 0) - redeemedPoints.points).toLocaleString('vi-VN')}</span>
                        </>
                      ) : (
                        <span>{customer.points?.toLocaleString('vi-VN') || 0}</span>
                      )}
                      <span className="ml-1 text-xs text-muted-foreground">điểm</span>
                    </span>
                  </div>
                  
                  {/* Points Action Button */}
                  <div className="sm:ml-auto">
                    {redeemedPoints.value > 0 ? (
                      <Button onClick={handleCancelRedemption} variant="destructive" size="sm" className="h-8 text-xs">
                        Hủy đổi
                      </Button>
                    ) : (
                      <Button onClick={() => setIsRedeemDialogOpen(true)} variant="outline" size="sm" className="h-8 text-xs" disabled={(customer.points || 0) === 0}>
                        Đổi điểm
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tier Discount Row */}
                {customer.tier && customer.tier !== 'Vô danh' && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex items-center text-sm sm:text-base">
                      <span className="font-medium text-muted-foreground">Ưu đãi hạng:</span>
                      <span className="ml-2 font-bold text-primary">
                        {appliedTierDiscount.amount > 0 ? (
                          `Đã giảm ${formatCompactCurrency(appliedTierDiscount.amount)}`
                        ) : (
                          'Chưa áp dụng'
                        )}
                      </span>
                      {tierDiscountInfo.period && typeof tierDiscountInfo.remaining === 'number' && appliedTierDiscount.amount > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Còn {tierDiscountInfo.remaining - 1 < 0 ? 0 : tierDiscountInfo.remaining - 1} lượt/{tierDiscountInfo.period})
                        </span>
                      )}
                    </div>
                    
                    {/* Tier Discount Action Button */}
                    <div>
                      {appliedTierDiscount.amount > 0 ? (
                        <Button onClick={handleCancelTierDiscount} variant="destructive" size="sm" className="h-8 text-xs">
                          Hủy ưu đãi
                        </Button>
                      ) : (
                        <Button onClick={handleApplyTierDiscount} variant="outline" size="sm" className="h-8 text-xs">
                          Áp dụng ưu đãi
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <SheetDescription className="sr-only">
            Giỏ hàng của khách hàng. Tại đây bạn có thể xem lại các mặt hàng, áp dụng điểm thưởng và tiến hành thanh toán.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
            </div>
          ) : (
            <ScrollArea className="h-full no-scrollbar">
              <div className="pr-4">
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                  <Table className="w-full">
                      <TableHeader>
                          <TableRow>
                              <TableHead className="pl-4 sm:pl-6 min-w-[250px]">Sản phẩm</TableHead>
                              <TableHead className="min-w-[70px]">Đơn vị</TableHead>
                              <TableHead className="text-right">Đơn giá</TableHead>
                              <TableHead className="text-center w-[130px]">Số lượng</TableHead>
                              <TableHead className="text-right">Thành tiền</TableHead>
                              <TableHead className="text-center w-[100px]">Thao tác</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {cart.map(item => {
                              const stockItem = inventory.find(p => p.id === item.id);
                              const maxQuantity = stockItem?.quantity ?? 0;
                              return (
                                  <TableRow key={item.id} className="align-middle">
                                      <TableCell className="pl-4 sm:pl-6 font-medium py-3">
                                          <div className="flex items-center gap-3">
                                              <Image
                                                  src={item.images?.[0] || 'https://placehold.co/40x40.png'}
                                                  alt={item.name}
                                                  width={40}
                                                  height={40}
                                                  className="rounded-md object-cover aspect-square border"
                                                  data-ai-hint={`${item.name.split(' ')[0]} flower`}
                                              />
                                              <div className="min-w-0 flex-1">
                                                  <p className="font-semibold leading-tight">{item.name}</p>
                                              </div>
                                          </div>
                                      </TableCell>
                                      <TableCell>{item.unit}</TableCell>
                                      <TableCell className="text-right">
                                          <div className="font-medium">{formatCompactCurrency(item.price)}</div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex items-center justify-center gap-1">
                                              <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              className="h-7 w-7 shrink-0"
                                              onClick={() => onUpdateQuantity(item.id, (item.quantityInCart - 1).toString())}
                                              disabled={item.quantityInCart <= 1}
                                              >
                                              <Minus className="h-4 w-4" />
                                              </Button>
                                              <Input
                                              type="number"
                                              value={item.quantityInCart.toString()}
                                              onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                                              className="h-7 w-12 text-center hide-number-spinners bg-card"
                                              min="0"
                                              />
                                              <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              className="h-7 w-7 shrink-0"
                                              onClick={() => onUpdateQuantity(item.id, (item.quantityInCart + 1).toString())}
                                              disabled={item.quantityInCart >= maxQuantity}
                                              >
                                              <Plus className="h-4 w-4" />
                                              </Button>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-right font-semibold text-primary">
                                          <div className="font-semibold">{formatCompactCurrency(item.price * item.quantityInCart)}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex justify-center gap-1">
                                          <Button
                                              variant="outline"
                                              size="icon"
                                              className={cn(
                                                "h-7 w-7 relative",
                                                item.notes ? "border-primary text-primary hover:bg-primary/5" : "text-muted-foreground hover:text-primary"
                                              )}
                                              onClick={() => onOpenNoteEditor(item.id)}
                                              title={item.notes ? `Sửa ghi chú: "${item.notes}"` : "Thêm ghi chú"}
                                          >
                                              <Pencil className="h-3 w-3" />
                                              {item.notes && (
                                                <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                                              )}
                                          </Button>
                                          <Button
                                              variant="destructive"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() => onRemoveItem(item.id)}
                                              title="Xóa sản phẩm"
                                          >
                                              <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                      </TableBody>
                  </Table>
                </div>
                
                {/* Mobile View: Card List */}
                <div className="md:hidden space-y-3 px-2">
                  {cart.map(item => {
                    const stockItem = inventory.find(p => p.id === item.id);
                    const maxQuantity = stockItem?.quantity ?? 0;
                    return (
                      <div key={`mobile-${item.id}`} className="bg-muted/40 rounded-lg p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Image
                              src={item.images?.[0] || 'https://placehold.co/64x64.png'}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-md object-cover aspect-square border"
                              data-ai-hint={`${item.name.split(' ')[0]} flower`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm leading-tight">{item.name}</p>
                              <div className="mt-1 space-y-0.5">
                                {item.unit && (
                                  <p className="text-xs text-muted-foreground">
                                    <span>Đơn vị:</span> <span className="text-foreground font-medium">{item.unit}</span>
                                  </p>
                                )}
                                <p className="text-sm font-medium text-primary">{formatCompactCurrency(item.price)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "h-7 w-7 relative",
                                  item.notes ? "border-primary text-primary hover:bg-primary/5" : "text-muted-foreground hover:text-primary"
                                )}
                                onClick={() => onOpenNoteEditor(item.id)}
                                title={item.notes ? `Sửa ghi chú: "${item.notes}"` : "Thêm ghi chú"}
                            >
                                <Pencil className="h-3 w-3" />
                                {item.notes && (
                                  <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-destructive ring-1 ring-background" />
                                )}
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onRemoveItem(item.id)}
                                title="Xóa sản phẩm"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => onUpdateQuantity(item.id, (item.quantityInCart - 1).toString())}
                              disabled={item.quantityInCart <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantityInCart.toString()}
                              onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                              className="w-14 h-8 text-center text-sm hide-number-spinners px-1 bg-card"
                              min="0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => onUpdateQuantity(item.id, (item.quantityInCart + 1).toString())}
                              disabled={item.quantityInCart >= maxQuantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Thành tiền</div>
                            <p className="font-semibold text-sm text-primary">
                              {formatCompactCurrency(item.price * item.quantityInCart)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary Section */}
                {cart.length > 0 && (
                  <div className="px-4 sm:px-6 py-4 mt-4 border-t flex justify-center">
                    <div className="w-full">
                      <div className="flex justify-between w-full text-base sm:text-lg font-semibold">
                        <p>Tổng cộng:</p>
                        <p>{formatCompactCurrency(totalAmount)}</p>
                      </div>
                      {appliedTierDiscount.amount > 0 && (
                        <div className="flex justify-between w-full text-sm sm:text-lg font-semibold text-green-600">
                          <div className="flex flex-col">
                            <p>Giảm giá ({customer?.tier} - {Math.round(appliedTierDiscount.percentage * 100) / 100}%):</p>
                            {tierDiscountInfo.period && typeof tierDiscountInfo.remaining === 'number' && (
                              <p className="text-xs text-muted-foreground font-normal">
                                (Còn {tierDiscountInfo.remaining - 1 < 0 ? 0 : tierDiscountInfo.remaining - 1} lượt trong {tierDiscountInfo.period} này)
                              </p>
                            )}
                          </div>
                          <p>-{formatCompactCurrency(appliedTierDiscount.amount)}</p>
                        </div>
                      )}
                      {redeemedPoints.value > 0 && (
                        <div className="flex justify-between w-full text-sm sm:text-lg font-semibold text-green-600">
                          <p>Đổi điểm:</p>
                          <p>-{formatCompactCurrency(redeemedPoints.value)}</p>
                        </div>
                      )}
                      <div className="flex justify-between w-full text-lg sm:text-xl font-bold text-primary">
                        <p>Thành tiền:</p>
                        <p>{formatCompactCurrency(finalTotal)}</p>
                      </div>
                      
                      {/* Payment Section - Mobile Optimized */}
                      <div className="w-full space-y-4 pt-4">
                        <div>
                            <Label className="font-semibold text-sm sm:text-base">Phương thức thanh toán</Label>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Nhấn "Thanh toán" để hiển thị mã QR thanh toán.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        {cart.length > 0 && (
          <SheetFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t">
            <Button onClick={handlePlaceOrder} className="w-full bg-primary text-primary-foreground h-10 sm:h-12 text-sm sm:text-base" size="lg">
              Thanh toán
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
    <RedeemPointsDialog
        isOpen={isRedeemDialogOpen}
        onOpenChange={setIsRedeemDialogOpen}
        customer={customer}
        onRedeem={handleRedeem}
        cartTotal={totalAmount}
    />
    
    {/* QR Payment Dialog */}
    <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Thanh toán qua chuyển khoản</DialogTitle>
          <DialogDescription className="text-center">
            Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {currentOrderId && (
            <>
              <QRCodeCanvas
                value={generateBankQRContent({
                  accountNumber: DEFAULT_BANK_ACCOUNT.accountNumber,
                  accountName: DEFAULT_BANK_ACCOUNT.accountName,
                  amount: finalTotal,
                  description: generatePaymentDescription(currentOrderId, customer?.name),
                  bankCode: DEFAULT_BANK_ACCOUNT.bankCode
                })}
                size={240}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"M"}
                includeMargin={true}
              />
              
              {/* Bank Account Info */}
              <div className="w-full p-4 bg-muted/20 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Ngân hàng:</span>
                  <span>{DEFAULT_BANK_ACCOUNT.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Số tài khoản:</span>
                  <span className="font-mono">{DEFAULT_BANK_ACCOUNT.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tên tài khoản:</span>
                  <span>{DEFAULT_BANK_ACCOUNT.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Số tiền:</span>
                  <span className="font-bold text-primary">{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Nội dung:</span>
                  <span className="font-mono text-xs">{generatePaymentDescription(currentOrderId, customer?.name)}</span>
                </div>
              </div>
              
              {/* Auto confirmation note */}
              <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 text-center">
                  ✨ <strong>Tự động xác nhận:</strong> Đơn hàng sẽ được xác nhận tự động sau khi chuyển khoản thành công
                </p>
              </div>
            </>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Mã đơn hàng: <span className="font-mono font-bold">{currentOrderId}</span>
            </p>
            {customer && (
              <p className="text-xs text-muted-foreground">
                Khách hàng: {customer.name}
              </p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            <Button 
              onClick={() => {
                setIsQRDialogOpen(false);
                // Don't reset order as payment might be processing
                toast({ 
                  title: "Chờ thanh toán", 
                  description: "Đơn hàng đã được tạo. Vui lòng hoàn tất thanh toán.",
                  duration: 3000
                });
              }}
              variant="outline"
              className="flex-1"
            >
              Đóng
            </Button>
            <Button 
              onClick={() => {
                if (currentOrderId) {
                  navigator.clipboard?.writeText(currentOrderId);
                  toast({ 
                    title: "Đã sao chép", 
                    description: "Mã đơn hàng đã được sao chép vào clipboard",
                    duration: 2000
                  });
                }
              }}
              variant="outline"
              className="flex-1"
            >
              Sao chép mã
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
