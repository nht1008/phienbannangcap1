"use client";

import React, { useState, useEffect } from 'react';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { DebtHistoryEntry } from '@/lib/debt-history';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, User, DollarSign, FileText } from 'lucide-react';

interface CustomerDebtHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customerId: string;
  customerName: string;
}

export function CustomerDebtHistoryDialog({ 
  isOpen, 
  onOpenChange, 
  customerId, 
  customerName 
}: CustomerDebtHistoryDialogProps) {
  const [debtHistory, setDebtHistory] = useState<DebtHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    setIsLoading(true);
    const historyQuery = query(
      ref(db, 'debtHistory'),
      orderByChild('customerId'),
      equalTo(customerId)
    );

    const unsubscribe = onValue(historyQuery, (snapshot) => {
      const data = snapshot.val();
      const historyArray: DebtHistoryEntry[] = data 
        ? Object.keys(data).map(key => ({ id: key, ...data[key] }))
        : [];
      
      // Sắp xếp theo thời gian giảm dần (mới nhất trước)
      historyArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDebtHistory(historyArray);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching debt history:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, customerId]);

  const getActionBadge = (action: DebtHistoryEntry['action']) => {
    switch (action) {
      case 'CREATE_DEBT':
        return <Badge variant="destructive"><FileText className="w-3 h-3 mr-1" />Tạo nợ</Badge>;
      case 'PAYMENT':
        return <Badge className="bg-green-600 text-white"><DollarSign className="w-3 h-3 mr-1" />Thanh toán</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getAmountDisplay = (entry: DebtHistoryEntry) => {
    const isNegative = entry.action === 'PAYMENT';
    const backgroundClass = isNegative ? 'bg-green-600' : 'bg-red-600';

    return (
      <span className={`font-medium text-white px-2 py-1 rounded ${backgroundClass}`}>
        {isNegative ? '-' : '+'}{entry.amount.toLocaleString('vi-VN')} VNĐ
      </span>
    );
  };

  const totalDebtCreated = debtHistory
    .filter(entry => entry.action === 'CREATE_DEBT')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalPaid = debtHistory
    .filter(entry => entry.action === 'PAYMENT')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const currentBalance = totalDebtCreated - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6" />
            Lịch sử công nợ - {customerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tổng quan */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tổng nợ đã tạo</p>
              <p className="text-xl font-bold text-red-600">
                {totalDebtCreated.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Đã thanh toán</p>
              <p className="text-xl font-bold text-green-600">
                {totalPaid.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Còn lại</p>
              <p className="text-xl font-bold text-red-600">
                {currentBalance.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
          </div>

          {/* Bảng lịch sử */}
          <ScrollArea className="h-[400px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <p>Đang tải lịch sử...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Thời gian</TableHead>
                    <TableHead className="w-[120px]">Hành động</TableHead>
                    <TableHead className="w-[140px] text-right">Số tiền</TableHead>
                    <TableHead className="w-[140px] text-right">Nợ còn lại</TableHead>
                    <TableHead className="w-[120px]">Nhân viên</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtHistory.length > 0 ? (
                    debtHistory.map((entry) => {
                      const entryDate = new Date(entry.date);
                      return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {entryDate.toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-muted-foreground text-xs ml-4">
                              {entryDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(entry.action)}
                        </TableCell>
                        <TableCell className="text-right">
                          {getAmountDisplay(entry)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className="bg-red-600 text-white px-2 py-1 rounded">
                            {entry.remainingDebt.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.employeeName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.action === 'PAYMENT' ? (entry.notes || '-') : '-'}
                          {entry.action === 'PAYMENT' && entry.invoiceId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              HĐ: {entry.invoiceId.slice(-8)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )})
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Không có lịch sử công nợ.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
