"use client";

import React, { useState } from 'react';
import type { Invoice, InvoiceCartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoDataIllustration } from '@/components/illustrations/NoDataIllustration';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailedInvoicesTableProps {
  invoices: Invoice[];
}

export function DetailedInvoicesTable({ invoices }: DetailedInvoicesTableProps) {
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <NoDataIllustration />
          <h3 className="text-xl font-semibold">Không có hóa đơn</h3>
          <p className="text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc đã chọn.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Giờ</TableHead>
              <TableHead className="text-right">Tổng tiền HĐ</TableHead>
              <TableHead className="text-right">Tổng giá gốc HĐ</TableHead>
              <TableHead className="text-right">Lợi nhuận HĐ</TableHead>
              <TableHead className="text-right text-[hsl(var(--destructive))]">Tiền nợ</TableHead>
              <TableHead className="text-center">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, index) => {
              const hasDebt = invoice.debtAmount && invoice.debtAmount > 0;
              const actualInvoiceCost = invoice.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0);
              const tableDisplayTotal = invoice.total;
              const tableDisplayCost = actualInvoiceCost;
              const tableDisplayProfit = tableDisplayTotal - tableDisplayCost;
              const invoiceDate = new Date(invoice.date);

              return (
                <TableRow key={invoice.id} className={ hasDebt ? 'bg-destructive/5 hover:bg-destructive/10' : ''}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{invoice.id.substring(0,6)}...</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{invoiceDate.toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                  <TableCell className="text-right">{tableDisplayTotal.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right">{tableDisplayCost.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right">{tableDisplayProfit.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right text-[hsl(var(--destructive))]">{(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" onClick={() => setSelectedInvoiceDetails(invoice)}>
                       <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedInvoiceDetails && (
        <Dialog open={!!selectedInvoiceDetails} onOpenChange={(open) => !open && setSelectedInvoiceDetails(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Chi tiết hóa đơn #{selectedInvoiceDetails.id.substring(0,6)}...</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <div><strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName}</div>
                  <div><strong>Ngày tạo:</strong> {new Date(selectedInvoiceDetails.date).toLocaleDateString('vi-VN')}</div>
                  <div><strong>Giờ tạo:</strong> {new Date(selectedInvoiceDetails.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-60 no-scrollbar">
              <h4 className="font-semibold mb-2 text-foreground">Sản phẩm đã mua:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Tên Sản phẩm</TableHead>
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
                  {selectedInvoiceDetails.items.map((item: InvoiceCartItem, idx: number) => (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell className="font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-xs">{item.color || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.quality}</TableCell>
                      <TableCell className="text-xs">{item.size || 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.unit || 'N/A'}</TableCell>
                      <TableCell className="text-right text-xs">{item.quantityInCart}</TableCell>
                      <TableCell className="text-right text-xs">{item.price.toLocaleString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-semibold text-primary text-xs">
                        {(item.price * item.quantityInCart - (item.itemDiscount || 0)).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Separator className="my-3" />
            {selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0) > 0 && (
                <>
                    <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                        <span>Tổng giảm giá SP:</span>
                        <span>-{selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.itemDiscount || 0), 0).toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </>
            )}
            <div className="flex justify-between font-bold text-lg text-foreground">
              <span>Tổng thanh toán HĐ:</span>
              <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
             <div className="flex justify-between text-sm">
                <span>Tổng giá gốc hóa đơn:</span>
                <span>
                    {selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0).toLocaleString('vi-VN')} VNĐ
                </span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[hsl(var(--success))]">
                <span>Lợi nhuận hóa đơn:</span>
                <span>
                    {(selectedInvoiceDetails.total - selectedInvoiceDetails.items.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantityInCart, 0)).toLocaleString('vi-VN')} VNĐ
                </span>
            </div>

             {selectedInvoiceDetails.amountPaid !== undefined && (
                 <>
                    <Separator className="my-3" />
                     <div className={cn(
                          "flex justify-between text-sm",
                           selectedInvoiceDetails.paymentMethod === 'Tiền mặt' &&
                           ((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) > 0
                           ? 'text-[hsl(var(--success))]' : 'text-foreground'
                        )}>
                        <span>Đã thanh toán ({selectedInvoiceDetails.paymentMethod}):</span>
                        <span>
                            {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0)
                              ? selectedInvoiceDetails.total
                              : (selectedInvoiceDetails.amountPaid ?? 0)
                            ).toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                    {((!selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total > 0 && (
                         <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                            <span>Tiền thừa:</span>
                            <span>{((( !selectedInvoiceDetails.debtAmount || selectedInvoiceDetails.debtAmount === 0) ? selectedInvoiceDetails.total : (selectedInvoiceDetails.amountPaid ?? 0)) - selectedInvoiceDetails.total).toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                    {selectedInvoiceDetails.debtAmount && selectedInvoiceDetails.debtAmount > 0 && (
                         <div className="flex justify-between text-sm text-[hsl(var(--destructive))]">
                            <span>Số tiền nợ của HĐ này:</span>
                            <span>{selectedInvoiceDetails.debtAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    )}
                 </>
            )}
            <DialogFooter className="mt-4">
              <Button onClick={() => setSelectedInvoiceDetails(null)} variant="outline" className="w-full">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}