"use client";

import React from 'react';
import type { CartItem, Product, Customer, Invoice } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { calculateDiscount } from '@/lib/tiers';
import VipTierBadge from '@/components/shared/VipTierBadge';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { RedeemPointsDialog } from '@/components/points/RedeemPointsDialog';

interface EmployeeCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cart: CartItem[];
  inventory: Product[];
  customers: Customer[];
  invoices: Invoice[];
  numericDisplaySize: NumericDisplaySize;
  subtotalAfterItemDiscounts: number;
  onUpdateCartQuantity: (itemId: string, newQuantityStr: string) => void;
  onItemDiscountChange: (itemId: string, discountNghinStr: string) => boolean;
  onPayment: (
    selectedCustomer: Customer | null,
    paymentMethod: string,
    amountPaid: string,
    tierDiscount: number
  ) => void;
  areAllItemDiscountsValid: boolean;
}

export function EmployeeCartSheet({
  isOpen,
  onOpenChange,
  cart,
  inventory,
  customers,
  invoices,
  numericDisplaySize,
  subtotalAfterItemDiscounts,
  onUpdateCartQuantity,
  onItemDiscountChange,
  onPayment,
  areAllItemDiscountsValid,
}: EmployeeCartSheetProps) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState('Tiền mặt');
  const [amountPaid, setAmountPaid] = React.useState('');
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = React.useState(false);
  const [customerSearchText, setCustomerSearchText] = React.useState('');
  const [appliedTierDiscount, setAppliedTierDiscount] = React.useState({ amount: 0, percentage: 0 });
  const [tierDiscountInfo, setTierDiscountInfo] = React.useState<{ remaining?: number; period?: string }>({});
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = React.useState(false);
  const [redeemedPoints, setRedeemedPoints] = React.useState({ points: 0, value: 0 });
  const [totalDiscount, setTotalDiscount] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      // Reset state when the sheet opens to ensure a clean slate
      setSelectedCustomer(null);
      setPaymentMethod('Tiền mặt');
      setAmountPaid('');
      setCustomerSearchText('');
      setAppliedTierDiscount({ amount: 0, percentage: 0 });
      setTierDiscountInfo({});
      setRedeemedPoints({ points: 0, value: 0 });
      setTotalDiscount('');
    }
  }, [isOpen]);

  // Reset applied discount when customer changes
  React.useEffect(() => {
    setAppliedTierDiscount({ amount: 0, percentage: 0 });
    setTierDiscountInfo({});
    setRedeemedPoints({ points: 0, value: 0 });
    setTotalDiscount('');
  }, [selectedCustomer]);

  const filteredCustomers = React.useMemo(() => {
    const normalizedSearch = customerSearchText.toLowerCase();
    if (!normalizedSearch) {
      return customers;
    }
    return customers.filter(c =>
      c.name.toLowerCase().includes(normalizedSearch) ||
      (c.phone && c.phone.includes(normalizedSearch))
    );
  }, [customers, customerSearchText]);

  const handleItemDiscountInputChange = (itemId: string, discountStr:string) => {
    onItemDiscountChange(itemId, discountStr);
  };

  const handleApplyTierDiscount = () => {
    if (redeemedPoints.value > 0) {
      toast({ title: "Lỗi", description: "Không thể áp dụng ưu đãi hạng khi đã đổi điểm.", variant: "destructive" });
      return;
    }
    if (selectedCustomer) {
      const result = calculateDiscount(selectedCustomer, subtotalAfterItemDiscounts, invoices);
      setTierDiscountInfo({ remaining: result.remainingUses, period: result.usagePeriod });
      if (result.success) {
        setAppliedTierDiscount({ amount: result.discountAmount, percentage: result.discountPercentage });
        toast({
          title: "Thành công",
          description: result.message,
          variant: "default",
        });
      } else {
        setAppliedTierDiscount({ amount: 0, percentage: 0 }); // Reset discount if not applicable
        toast({
          title: "Không thể áp dụng",
          description: result.message,
          variant: "destructive",
        });
      }
    } else {
        toast({
            title: "Chưa chọn khách hàng",
            description: "Vui lòng chọn một khách hàng để áp dụng ưu đãi.",
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
      toast({ title: "Lỗi", description: "Không thể đổi điểm khi đã áp dụng ưu đãi hạng.", variant: "destructive" });
      return;
    }
    setRedeemedPoints({ points, value });
    setIsRedeemDialogOpen(false);
    toast({ title: "Thành công", description: `Đã đổi ${points} điểm để được giảm ${value.toLocaleString('vi-VN')} VNĐ.` });
  };

  const handleCancelRedemption = () => {
    setRedeemedPoints({ points: 0, value: 0 });
    toast({
      title: "Đã hủy",
      description: "Đã hủy bỏ đổi điểm.",
      variant: "default",
    });
  };
  
  const finalTotal = subtotalAfterItemDiscounts - appliedTierDiscount.amount - redeemedPoints.value - (parseFloat(totalDiscount) * 1000 || 0);

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-5xl flex flex-col">
        <SheetHeader className="flex flex-row items-start justify-between pr-4 pb-4 border-b">
          <div className="space-y-1">
            <SheetTitle className="flex items-center text-xl">
              {cart.reduce((acc, item) => acc + item.quantityInCart, 0)}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Quản lý giỏ hàng và tiến hành thanh toán.
            </SheetDescription>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
            {/* Customer Selection - Made wider for horizontal layout */}
            <div className="space-y-1 w-96">{/* Increased width significantly */}
              <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left h-auto min-h-[48px] p-3">{/* Reduced height */}
                      <div className="flex items-center w-full">
                          {selectedCustomer ? (
                              <div className="flex items-center justify-between w-full min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="font-medium text-sm">{selectedCustomer.name}</div>
                                      {selectedCustomer.phone && (
                                        <>
                                          <span className="text-xs text-muted-foreground">•</span>
                                          <div className="text-xs text-muted-foreground">{selectedCustomer.phone}</div>
                                        </>
                                      )}
                                  </div>
                                  <div className="flex items-center flex-shrink-0 ml-2">
                                      {selectedCustomer?.tier && (
                                          <VipTierBadge tier={selectedCustomer.tier} className="text-xs" />
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <div className="flex items-center justify-between w-full">
                                  <span className="font-medium text-sm">Khách lẻ</span>
                              </div>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-4 max-w-lg">{/* Increased max width */}
                  <DialogHeader>
                    <DialogTitle>Chọn khách hàng</DialogTitle>
                    <DialogDescription>
                      Tìm kiếm và chọn một khách hàng từ danh sách.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col space-y-2">
                    <Input
                      id="customer-search-dialog"
                      placeholder="Tìm khách hàng..."
                      value={customerSearchText}
                      onChange={(e) => setCustomerSearchText(e.target.value)}
                      className="bg-card"
                    />
                    <ScrollArea className="h-64 border rounded-md">{/* Increased height from h-48 to h-64 */}
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-2 text-left h-auto"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearchText('');
                            setIsCustomerDialogOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedCustomer === null ? 'opacity-100' : 'opacity-0')} />
                          Khách lẻ
                        </Button>
                        {filteredCustomers.map((customer) => (
                            <Button
                              key={customer.id}
                              variant="ghost"
                              className="w-full justify-start p-3 text-left h-auto min-h-[60px]"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearchText('');
                                setIsCustomerDialogOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center min-w-0 flex-1">
                                  <Check className={cn("mr-3 h-4 w-4 flex-shrink-0", selectedCustomer?.id === customer.id ? 'opacity-100' : 'opacity-0')} />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold truncate">{customer.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {customer.phone || 'Không có SĐT'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                  {customer.tier && (
                                    <VipTierBadge tier={customer.tier} className="text-xs" />
                                  )}
                                  {customer.points && customer.points > 0 && (
                                    <div className="flex items-center text-xs text-amber-600 font-semibold">
                                      <Star className="w-3 h-3 mr-1" />
                                      <span>{customer.points}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Customer Action - Buttons side by side */}
            <div className="flex flex-col items-center space-y-2">
                <div className="flex gap-2">
                    {/* Tier Discount Button */}
                    {appliedTierDiscount.amount > 0 ? (
                      <Button 
                        onClick={handleCancelTierDiscount}
                        className="w-20 h-8 text-xs"
                        variant="destructive"
                      >
                        Hủy ưu đãi
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleApplyTierDiscount}
                        disabled={!selectedCustomer || !selectedCustomer.tier || selectedCustomer.tier === 'Vô danh'}
                        className="w-20 h-8 text-xs"
                        variant="outline"
                      >
                        Áp dụng
                      </Button>
                    )}
                    
                    {/* Points Redeem Button */}
                    {redeemedPoints.value > 0 ? (
                      <Button
                        onClick={handleCancelRedemption}
                        className="w-20 h-8 text-xs"
                        variant="destructive"
                      >
                        Hủy điểm
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsRedeemDialogOpen(true)}
                        disabled={!selectedCustomer}
                        className="w-20 h-8 text-xs"
                        variant="outline"
                      >
                        Đổi điểm
                      </Button>
                    )}
                </div>
                
                {/* Tier Info */}
                {selectedCustomer && selectedCustomer.tier && selectedCustomer.tier !== 'Vô danh' && (
                  <div className="text-xs text-center max-w-40">
                    <div className="text-muted-foreground text-xs leading-tight">
                      {(() => {
                        const tierInfo = {
                          'Đầy tớ': '1/tháng',
                          'Nông dân': 'Max 50k',
                          'Chủ đồn điền': 'Max 100k, 1/tuần',
                          'Thương gia': 'Max 150k, 2/tháng',
                          'Phú ông': 'Max 200k, 3/năm',
                          'Đại gia': 'Max 250k, 4/năm'
                        };
                        return tierInfo[selectedCustomer.tier as keyof typeof tierInfo] || '';
                      })()}
                    </div>
                    {/* Show remaining uses if available */}
                    {tierDiscountInfo.period && typeof tierDiscountInfo.remaining === 'number' && (
                      <div className="text-green-600 font-semibold text-xs">
                        Còn {tierDiscountInfo.remaining}/{tierDiscountInfo.period}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Points Info - Moved here */}
                {selectedCustomer && selectedCustomer.points && selectedCustomer.points > 0 && (
                  <div className="flex items-center text-xs text-amber-600 font-semibold">
                    <Star className="w-3 h-3 mr-1" />
                    {redeemedPoints.points > 0 ? (
                      <>
                        <span className="line-through">{selectedCustomer.points}</span>
                        <span className="mx-1">→</span>
                        <span>{selectedCustomer.points - redeemedPoints.points}</span>
                      </>
                    ) : (
                      <span>{selectedCustomer.points}</span>
                    )}
                  </div>
                )}
            </div>
            {/* Payment Method - More compact */}
            <div className="space-y-1 w-32">
              <ToggleGroup
                type="single"
                value={paymentMethod}
                onValueChange={(value) => {
                  if (value) setPaymentMethod(value);
                }}
                className="flex flex-col gap-1"
              >
                <ToggleGroupItem value="Tiền mặt" aria-label="Tiền mặt" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-7 text-xs">
                  Tiền mặt
                </ToggleGroupItem>
                <ToggleGroupItem value="Chuyển khoản" aria-label="Chuyển khoản" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-7 text-xs">
                  CK
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {/* Total Discount - More compact */}
            <div className="space-y-1 w-24">
              <label className="text-xs text-muted-foreground">Giảm giá</label>
              <Input
                type="number"
                value={totalDiscount}
                onChange={(e) => setTotalDiscount(e.target.value)}
                placeholder="0"
                className="h-7 w-full text-xs text-center hide-number-spinners"
                min="0"
              />
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center py-8 px-3">Giỏ hàng trống</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="pr-4">
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead className="min-w-[200px]">Sản phẩm</TableHead>
                        <TableHead className="min-w-[120px]">Thuộc tính</TableHead>
                        <TableHead className="min-w-[80px]">Lô hàng</TableHead>
                        <TableHead className="text-center w-[120px]">Số lượng</TableHead>
                        <TableHead className="text-right min-w-[80px]">Đơn giá</TableHead>
                        <TableHead className="text-center w-[90px]">Giảm giá</TableHead>
                        <TableHead className="text-right min-w-[100px]">Thành tiền</TableHead>
                        <TableHead className="text-center w-[40px]">Xóa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => {
                        const itemOriginalTotal = item.price * item.quantityInCart;
                        const itemFinalTotal = itemOriginalTotal - (item.itemDiscount || 0);
                        return (
                          <TableRow key={`cart-item-${item.id}-${index}`}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="py-2 align-middle">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={item.images?.[0] || `https://placehold.co/40x40.png`}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-md object-cover aspect-square border"
                                  onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png')}
                                />
                                <div>
                                    <p className="font-semibold text-foreground text-sm leading-tight">{item.name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 align-middle text-sm">
                              <div className="text-foreground text-xs font-medium">
                                {[item.color, item.quality, item.size].filter(Boolean).join(' - ')}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 align-middle text-sm">
                              {item.batchNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart - 1).toString())}
                                  disabled={item.quantityInCart <= 0}
                                  aria-label="Giảm số lượng"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  id={`cart-item-quantity-desktop-${item.id}`}
                                  type="number"
                                  value={item.quantityInCart.toString()}
                                  onChange={(e) => onUpdateCartQuantity(item.id, e.target.value)}
                                  className="w-12 h-7 text-center text-sm hide-number-spinners px-1 bg-card"
                                  min="0"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart + 1).toString())}
                                  disabled={item.quantityInCart >= (inventory.find(p => p.id === item.id)?.quantity ?? 0)}
                                  aria-label="Tăng số lượng"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-2 align-middle text-sm">{item.price.toLocaleString('vi-VN')}</TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <Input
                                id={`desktop-item-discount-${item.id}`}
                                type="number"
                                value={typeof item.itemDiscount === 'number' ? (item.itemDiscount / 1000).toString() : ""}
                                onChange={(e) => handleItemDiscountInputChange(item.id, e.target.value)}
                                min="0"
                                step="0.1"
                                className="h-7 w-20 bg-card text-xs p-1 hide-number-spinners text-center"
                                placeholder="Nghìn"
                              />
                            </TableCell>
                            <TableCell className={cn("text-right py-2 align-middle font-semibold text-sm",(item.itemDiscount || 0) > 0 ? "text-green-600" : "text-primary")}>
                              {itemFinalTotal.toLocaleString('vi-VN')}
                              {(item.itemDiscount || 0) > 0 && (
                                  <p className="text-xs text-destructive font-normal normal-case">
                                      (từ {itemOriginalTotal.toLocaleString('vi-VN')})
                                  </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2 align-middle">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onUpdateCartQuantity(item.id, '0')}
                                aria-label="Xóa sản phẩm khỏi giỏ hàng"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile View: Card List */}
                <div className="md:hidden space-y-3">
                  {cart.map((item, index) => {
                    const itemOriginalTotal = item.price * item.quantityInCart;
                    const itemFinalTotal = itemOriginalTotal - (item.itemDiscount || 0);
                    return (
                      <div key={`cart-mobile-${item.id}-${index}`} className="bg-muted/40 rounded-lg p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Image
                              src={item.images?.[0] || `https://placehold.co/64x64.png`}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-md object-cover aspect-square border"
                              onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/64x64.png')}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm leading-tight truncate">{item.name}</p>
                              <div className="mt-1 space-y-0.5">
                                {item.color && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="text-muted-foreground">Màu:</span> <span className="text-foreground font-medium">{item.color}</span>
                                  </p>
                                )}
                                {item.quality && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="text-muted-foreground">Chất lượng:</span> <span className="text-foreground font-medium">{item.quality}</span>
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs">
                                  {item.size && (
                                    <span><span className="text-muted-foreground">Size:</span> <span className="text-foreground font-medium">{item.size}</span></span>
                                  )}
                                  {item.unit && (
                                    <span><span className="text-muted-foreground">Đơn vị:</span> <span className="text-foreground font-medium">{item.unit}</span></span>
                                  )}
                                  {item.batchNumber && (
                                    <span><span className="text-muted-foreground">Lô:</span> <span className="text-foreground font-medium">{item.batchNumber}</span></span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm font-medium text-primary mt-1">{item.price.toLocaleString('vi-VN')} VNĐ</p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => onUpdateCartQuantity(item.id, '0')}
                            aria-label="Xóa sản phẩm khỏi giỏ hàng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart - 1).toString())}
                              disabled={item.quantityInCart <= 0} aria-label="Giảm số lượng"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              id={`cart-item-quantity-mobile-${item.id}`}
                              type="number" value={item.quantityInCart.toString()}
                              onChange={(e) => onUpdateCartQuantity(item.id, e.target.value)}
                              className="w-14 h-8 text-center text-base hide-number-spinners px-1 bg-card"
                              min="0"
                            />
                            <Button
                              type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => onUpdateCartQuantity(item.id, (item.quantityInCart + 1).toString())}
                              disabled={item.quantityInCart >= (inventory.find(p => p.id === item.id)?.quantity ?? 0)}
                              aria-label="Tăng số lượng"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              id={`mobile-item-discount-${item.id}`} type="number"
                              value={typeof item.itemDiscount === 'number' ? (item.itemDiscount / 1000).toString() : ""}
                              onChange={(e) => handleItemDiscountInputChange(item.id, e.target.value)}
                              min="0" step="0.1"
                              className="h-8 w-20 bg-card text-xs p-1 hide-number-spinners text-center" placeholder="Giảm (Nghìn)"
                            />
                          </div>
                          <div className="text-right">
                            <p className={cn("font-semibold text-sm", (item.itemDiscount || 0) > 0 ? "text-green-600" : "text-primary")}>
                              {itemFinalTotal.toLocaleString('vi-VN')}
                            </p>
                            {(item.itemDiscount || 0) > 0 && (
                              <p className="text-xs text-destructive font-normal">
                                (từ {itemOriginalTotal.toLocaleString('vi-VN')})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t mt-4 pt-4"></div>
              </div>
            </ScrollArea>
          )}
        </div>
       {paymentMethod === 'Chuyển khoản' && (
         <div className="flex justify-center p-3 border-t">
           <div className="w-full md:w-1/2 flex flex-col items-center">
             <span className="font-medium mb-2 text-sm">Quét mã QR để thanh toán</span>
             <QRCodeCanvas
                 value={`bank_account_info_here`} // Replace with actual bank info
                 size={200}
                 bgColor={"#ffffff"}
                 fgColor={"#000000"}
                 level={"L"}
                 includeMargin={true}
             />
               <p className="mt-2 text-xs text-center">
                   Tổng tiền: {finalTotal.toLocaleString('vi-VN')} VNĐ
               </p>
           </div>
         </div>
       )}
        {/* Summary Section - Made more compact */}
        <div className="border-t bg-background p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-2 gap-x-3">
            {/* Left column for totals - More compact */}
            <div className="space-y-1 border-r pr-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-muted-foreground">Tạm tính:</span>
                <span className="font-semibold text-sm">{subtotalAfterItemDiscounts.toLocaleString('vi-VN')}</span>
              </div>
              {appliedTierDiscount.amount > 0 && (
                <div className="flex justify-between items-center text-xs text-green-600">
                  <span className="font-medium">Ưu đãi ({selectedCustomer?.tier} - {Math.round(appliedTierDiscount.percentage * 100) / 100}%):</span>
                  <span className="font-semibold text-sm">-{appliedTierDiscount.amount.toLocaleString('vi-VN')}</span>
                </div>
              )}
              {redeemedPoints.value > 0 && (
                <div className="flex justify-between items-center text-xs text-green-600">
                  <span className="font-medium">Đổi điểm:</span>
                  <span className="font-semibold text-sm">-{redeemedPoints.value.toLocaleString('vi-VN')}</span>
                </div>
              )}
              {parseFloat(totalDiscount) > 0 && (
                <div className="flex justify-between items-center text-xs text-green-600">
                  <span className="font-medium">Giảm giá tổng:</span>
                  <span className="font-semibold text-sm">-{(parseFloat(totalDiscount) * 1000).toLocaleString('vi-VN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base border-t pt-1 mt-1">
                <span className="font-bold text-red-600">Thành tiền:</span>
                <span className="font-extrabold text-red-600 text-lg">{finalTotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {/* Right column for payment - More compact */}
            <div className="grid grid-cols-2 gap-x-2 items-start">
              <div className="space-y-1 text-center">
                <label htmlFor="amount-paid" className="text-xs font-medium">Khách trả</label>
                <Input
                  id="amount-paid"
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-8 text-center text-sm hide-number-spinners px-1 bg-card"
                />
              </div>
              <div className="space-y-1 text-center h-[44px]"> {/* Reduced height and made more compact */}
                {(() => {
                  const paid = parseFloat(amountPaid) * 1000 || 0;
                  const total = finalTotal;
                  const difference = paid - total;
                  const isGuest = selectedCustomer === null;

                  if (paid <= 0) {
                    return null; // Render nothing if no payment is entered
                  }

                  if (difference > 0) {
                    return (
                      <div className="animate-shake">
                        <span className="text-xs font-medium">Tiền thừa</span>
                        <p className="font-bold text-green-600 h-7 flex items-center justify-center text-sm">
                          {difference.toLocaleString('vi-VN')}
                        </p>
                      </div>
                    );
                  } 
                  
                  if (difference < 0 && !isGuest) {
                    return (
                      <div className="animate-shake">
                        <span className="text-xs font-medium">Còn nợ</span>
                        <p className="font-bold text-orange-500 h-7 flex items-center justify-center text-sm">
                          {(-difference).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    );
                  }

                  return null; // Render nothing for exact payment or guest underpayment
                })()}
              </div>
            </div>
          </div>
        </div>
        <SheetFooter className="pt-2 px-3 pb-2">{/* Reduced padding */}
          <Button
            onClick={() => onPayment(selectedCustomer, paymentMethod, amountPaid, appliedTierDiscount.amount > 0 ? appliedTierDiscount.amount : redeemedPoints.value)}
            className="w-full bg-green-500 text-white hover:bg-green-600 h-10"
            disabled={
              (() => {
                const paid = parseFloat(amountPaid) * 1000 || 0;
                const total = finalTotal;
                const isGuest = selectedCustomer === null;

                if (cart.length === 0 || !areAllItemDiscountsValid || total < 0) {
                  return true;
                }
                // Guests or bank transfers must pay in full
                if ((isGuest || paymentMethod === 'Chuyển khoản') && total > paid) {
                  return true;
                }
                return false;
              })()
            }
          >
            Thanh toán
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    <RedeemPointsDialog
        isOpen={isRedeemDialogOpen}
        onOpenChange={setIsRedeemDialogOpen}
        customer={selectedCustomer}
        onRedeem={handleRedeem}
        cartTotal={subtotalAfterItemDiscounts}
    />
    </>
  );
}
