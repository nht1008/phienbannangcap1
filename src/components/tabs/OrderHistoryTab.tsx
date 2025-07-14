"use client";

import React, { useState, useMemo } from 'react';
import type { Invoice, InvoiceCartItem } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ListChecks } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { normalizeStringForSearch } from '@/lib/utils';

interface OrderHistoryTabProps {
  invoices: Invoice[];
  currentUser: User | null;
}

export function OrderHistoryTab({ invoices, currentUser }: OrderHistoryTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const userInvoices = useMemo(() => {
    if (!currentUser) return [];
    return invoices
      .filter(invoice => invoice.customerId === currentUser.uid)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, currentUser]);

  return (
    <>
      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold">Lịch sử đặt hàng</CardTitle>
          <CardDescription>Xem lại tất cả các hóa đơn mua hàng của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          {userInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Bạn chưa có giao dịch nào.</p>
          ) : (
            <ScrollArea className="h-[70vh] no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>ID Hóa đơn</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead className="text-center">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userInvoices.map((invoice, index) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{invoice.id.substring(0, 8)}...</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold">{invoice.total.toLocaleString('vi-VN')} VNĐ</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(invoice)}>
                          <ListChecks className="h-5 w-5 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết hóa đơn #{selectedInvoice.id.substring(0, 6)}...</DialogTitle>
              <DialogDescription>
                Ngày: {new Date(selectedInvoice.date).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <ScrollArea className="max-h-[60vh] no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>K.Thước</TableHead>
                    <TableHead>ĐV</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.quality}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.quantityInCart}</TableCell>
                      <TableCell className="text-right">{item.price.toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {(item.price * item.quantityInCart).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Separator />
            <div className="flex justify-end font-bold text-lg text-primary">
              <span>Tổng cộng: {selectedInvoice.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}