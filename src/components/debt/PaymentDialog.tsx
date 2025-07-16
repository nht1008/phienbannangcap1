"use client";

import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Debt } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  debt: Debt | null;
  currentUser: User | null;
  onAddPayment: (debtId: string, amount: number, notes: string, employeeId: string, employeeName: string) => Promise<void>;
}

export function PaymentDialog({ isOpen, onOpenChange, debt, currentUser, onAddPayment }: PaymentDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
 
   useEffect(() => {
     if (debt) {
       // Suggest paying the full remaining amount by default, in thousands
       setAmount((debt.remainingAmount / 1000).toString());
       setError('');
       setNotes('');
       setPaymentMethod('cash');
     }
   }, [debt]);

  if (!debt || !currentUser) {
    return null;
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers (and a single decimal point)
    if (/^\d*\.?\d{0,3}$/.test(value)) {
      setAmount(value);
      const numericValue = parseFloat(value);
      const remainingInNghin = debt.remainingAmount / 1000;
      if (numericValue > remainingInNghin) {
        setError(`Số tiền không thể lớn hơn nợ còn lại (${remainingInNghin.toLocaleString('vi-VN')}K VNĐ).`);
      } else if (numericValue <= 0) {
        setError('Số tiền thanh toán phải lớn hơn 0.');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = async () => {
    const paymentAmountInNghin = parseFloat(amount);
    if (error || !paymentAmountInNghin || paymentAmountInNghin <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tiền hợp lệ.", variant: "destructive" });
      return;
    }

    const paymentAmountInVND = Math.round(paymentAmountInNghin * 1000);

    try {
      if (!currentUser?.uid || !currentUser?.displayName) {
        throw new Error("Không tìm thấy thông tin nhân viên.");
      }
      await onAddPayment(debt.id, paymentAmountInVND, notes, currentUser.uid, currentUser.displayName);
      toast({ title: "Thành công", description: "Đã ghi nhận thanh toán." });
      onOpenChange(false); // Close dialog on success
    } catch (e) {
      console.error("Failed to add payment: ", e);
      toast({ title: "Lỗi", description: "Thêm thanh toán thất bại. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  const remainingAfterPayment = debt.remainingAmount - (parseFloat(amount) * 1000 || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            Ghi nhận số tiền khách hàng đã thanh toán. Nhập số tiền bằng nghìn VNĐ.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-8 py-4">
           <div className="flex-1 space-y-4">
               <div className="p-3 rounded-lg bg-muted/50">
            <p><span className="font-semibold">Khách hàng:</span> {debt.customerName}</p>
            <p><span className="font-semibold">Số tiền còn nợ:</span> <span className="font-bold text-destructive">{debt.remainingAmount.toLocaleString('vi-VN')} VNĐ</span></p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Số tiền thanh toán (Nghìn VNĐ)</Label>
            <Input
              id="payment-amount"
              value={amount}
              onChange={handleAmountChange}
              type="text" // Use text to manage decimal input properly
              inputMode="decimal"
              className="text-lg font-bold"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
           <div className="space-y-2">
               <Label>Phương thức thanh toán</Label>
               <RadioGroup
                   value={paymentMethod}
                   onValueChange={setPaymentMethod}
                   className="flex space-x-4"
               >
                   <div className="flex items-center space-x-2">
                       <RadioGroupItem value="cash" id="cash" />
                       <Label htmlFor="cash">Tiền mặt</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                       <RadioGroupItem value="transfer" id="transfer" />
                       <Label htmlFor="transfer">Chuyển khoản</Label>
                   </div>
               </RadioGroup>
           </div>
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="payment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Chuyển khoản, tiền mặt..."
            />
          </div>
          <div className="p-3 rounded-lg bg-red-500 border border-red-700 text-white">
            <p><span className="font-semibold">Số tiền còn lại sau thanh toán:</span> {remainingAfterPayment.toLocaleString('vi-VN')} VNĐ</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
        {paymentMethod === 'transfer' && debt && (
           <div className="flex flex-col items-center justify-center p-4 border rounded-lg w-full h-full">
               <Label className="mb-4 text-center font-semibold text-lg">Quét mã QR để thanh toán</Label>
               <QRCodeCanvas
                 value={`bank_account_info_here`} // Replace with actual bank info
                 size={280}
                 bgColor={"#ffffff"}
                 fgColor={"#000000"}
                 level={"H"}
                 includeMargin={true}
               />
                <p className="mt-4 text-md text-center font-medium">
                 Nội dung: {debt.customerName} thanh toan {amount}K
               </p>
             </div>
           )}
           </div>
       </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Hủy
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={!!error || !amount}>
            Xác nhận thanh toán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}