"use client";

import React from 'react';
import type { Debt } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  debt: Debt | null;
}

export function PaymentHistoryDialog({ isOpen, onOpenChange, debt }: PaymentHistoryDialogProps) {
  if (!debt) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Lịch sử thanh toán</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <p><span className="font-semibold">Khách hàng:</span> {debt.customerName}</p>
            <p><span className="font-semibold">Tổng nợ:</span> {debt.originalAmount.toLocaleString('vi-VN')} VNĐ</p>
            <p><span className="font-semibold">Đã thanh toán:</span> <span className="text-success font-bold">{debt.amountPaid.toLocaleString('vi-VN')} VNĐ</span></p>
            <p><span className="font-semibold">Còn lại:</span> <span className="text-destructive font-bold">{debt.remainingAmount.toLocaleString('vi-VN')} VNĐ</span></p>
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày trả</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debt.payments && debt.payments.length > 0 ? (
                  debt.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm', { locale: vi })}</TableCell>
                      <TableCell className="text-right font-medium">{payment.amountPaid.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell>{payment.employeeName}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Chưa có lịch sử thanh toán.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}