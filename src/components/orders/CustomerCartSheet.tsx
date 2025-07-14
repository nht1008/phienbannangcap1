
"use client";

import React, { useState, useEffect } from 'react';
import type { CartItem, Product, Invoice } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
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

interface CustomerCartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cart: CartItem[];
  customer: Customer | null;
  onUpdateQuantity: (itemId: string, newQuantity: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: (discountAmount: number) => void;
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
  const discountResult = calculateDiscount(customer, totalAmount, invoices);
  const { discountAmount, discountPercentage, remainingUses, usagePeriod } = discountResult;
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState({ points: 0, value: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setRedeemedPoints({ points: 0, value: 0 });
    }
  }, [isOpen]);

  const handleRedeem = (points: number, value: number) => {
    if (discountAmount > 0) {
      toast({ title: "Lỗi", description: "Không thể đổi điểm khi đang áp dụng ưu đãi hạng.", variant: "destructive" });
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
 
   const handlePlaceOrder = () => {
     onPlaceOrder(discountAmount > 0 ? discountAmount : redeemedPoints.value);
   };
  
  const finalTotal = totalAmount - discountAmount - redeemedPoints.value;
  
  return (
    <>
    <Sheet open={isOpen} onOpenChange={(openState) => {
      console.log("DEBUG: CustomerCartSheet - Sheet open state changed:", openState);
      onOpenChange(openState);
    }}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-5xl">
        <SheetHeader className="px-4 sm:px-6 pt-6">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <ShoppingCart className="h-6 w-6" />
            <span>Giỏ hàng của bạn</span>
            {customer && <VipTierBadge tier={customer.tier || 'Vô danh'} />}
            {customer && (
              <div className="flex items-center text-lg ml-auto gap-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-amber-500" />
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
                  </span>
                </div>
                {redeemedPoints.value > 0 ? (
                  <Button onClick={handleCancelRedemption} variant="destructive" size="sm">
                    Hủy đổi
                  </Button>
                ) : (
                  <Button onClick={() => setIsRedeemDialogOpen(true)} variant="outline" size="sm" disabled={(customer.points || 0) === 0}>
                    Đổi điểm
                  </Button>
                )}
              </div>
            )}
          </SheetTitle>
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
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4 sm:pl-6 w-[350px]">Sản phẩm</TableHead>
                            <TableHead className="min-w-[70px]">Đơn vị</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead className="text-center w-[130px]">Số lượng</TableHead>
                            <TableHead className="text-right">Thành tiền</TableHead>
                            <TableHead className="text-center">Hành động</TableHead>
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
                                            <div>
                                                <p className="font-semibold leading-tight">{item.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        {item.price.toLocaleString('vi-VN')} VNĐ
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
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
                                        {(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ
                                    </TableCell>
                                    <TableCell className="text-center space-x-1">
                                      <Button
                                          variant="outline"
                                          size="icon"
                                          className={cn(
                                            "h-8 w-8 relative",
                                            item.notes ? "border-primary text-primary hover:bg-primary/5" : "text-muted-foreground hover:text-primary"
                                          )}
                                          onClick={() => onOpenNoteEditor(item.id)}
                                          title={item.notes ? `Sửa ghi chú: "${item.notes}"` : "Thêm ghi chú"}
                                      >
                                          <Pencil className="h-4 w-4" />
                                          {item.notes && (
                                            <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                                          )}
                                      </Button>
                                      <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => onRemoveItem(item.id)}
                                          title="Xóa sản phẩm"
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {cart.length > 0 && (
                  <div className="px-4 sm:px-6 py-4 mt-4 border-t flex justify-center">
                    <div className="w-full md:w-1/2">
                      <div className="flex justify-between w-full text-lg font-semibold">
                        <p>Tổng cộng:</p>
                        <p>{totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between w-full text-lg font-semibold text-green-600">
                          <div className="flex flex-col">
                            <p>Giảm giá ({customer?.tier} - {Math.round(discountPercentage * 100) / 100}%):</p>
                            {usagePeriod && typeof remainingUses === 'number' && (
                              <p className="text-xs text-muted-foreground font-normal">
                                (Còn {remainingUses - 1 < 0 ? 0 : remainingUses - 1} lượt trong {usagePeriod} này)
                              </p>
                            )}
                          </div>
                          <p>-{discountAmount.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      )}
                      {redeemedPoints.value > 0 && (
                        <div className="flex justify-between w-full text-lg font-semibold text-green-600">
                          <p>Đổi điểm:</p>
                          <p>-{redeemedPoints.value.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      )}
                      <div className="flex justify-between w-full text-xl font-bold text-primary">
                        <p>Thành tiền:</p>
                        <p>{finalTotal.toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                      <div className="w-full space-y-4 pt-4">
                        <div>
                            <Label className="font-semibold">Phương thức thanh toán</Label>
                            <p className="text-sm text-muted-foreground mt-1">Vui lòng quét mã QR để thanh toán qua chuyển khoản ngân hàng.</p>
                        </div>

                        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                            <Label className="mb-2 text-center font-semibold">Quét mã QR để thanh toán</Label>
                            <QRCodeCanvas
                                value={`bank_account_info_here`} // Replace with actual bank info
                                size={256}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"}
                                includeMargin={true}
                            />
                           <p className="mt-2 text-sm text-center">
                               Tổng tiền: {finalTotal.toLocaleString('vi-VN')} VNĐ
                           </p>
                            <p className="mt-2 text-xs text-muted-foreground text-center">
                                Nội dung: Thanh toan don hang
                            </p>
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
          <SheetFooter className="px-4 sm:px-6 py-4 border-t">
            <Button onClick={handlePlaceOrder} className="w-full bg-primary text-primary-foreground" size="lg">
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
    </>
  );
}
