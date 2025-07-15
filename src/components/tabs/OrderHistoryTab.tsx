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
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-bold">Lịch sử đặt hàng</CardTitle>
          <CardDescription className="text-sm md:text-base">Xem lại tất cả các hóa đơn mua hàng của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {userInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Bạn chưa có giao dịch nào.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                <ScrollArea className="h-[70vh] no-scrollbar">
                  {userInvoices.map((invoice, index) => (
                    <Card key={invoice.id} className="mb-3 border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                              <span className="text-sm font-medium text-muted-foreground">ID: {invoice.id.substring(0, 8)}...</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{new Date(invoice.date).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)} className="h-8 w-8 p-0">
                            <ListChecks className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">{invoice.total.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg md:text-xl">Chi tiết hóa đơn #{selectedInvoice.id.substring(0, 6)}...</DialogTitle>
              <DialogDescription className="text-sm">
                Ngày: {new Date(selectedInvoice.date).toLocaleString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <ScrollArea className="max-h-[50vh] no-scrollbar">
                <div className="space-y-3">
                  {selectedInvoice.items.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-primary/50">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                            <span className="text-sm font-bold text-primary ml-2">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Màu: <span className="font-medium">{item.color}</span></div>
                            <div>Chất lượng: <span className="font-medium">{item.quality}</span></div>
                            <div>Kích thước: <span className="font-medium">{item.size}</span></div>
                            <div>Đơn vị: <span className="font-medium">{item.unit}</span></div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-border">
                            <span className="text-xs">SL: <span className="font-medium">{item.quantityInCart}</span></span>
                            <span className="text-xs">Đơn giá: <span className="font-medium">{item.price.toLocaleString('vi-VN')} VNĐ</span></span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <Separator />
            <div className="flex justify-end font-bold text-base md:text-lg text-primary">
              <span>Tổng cộng: {selectedInvoice.total.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)} className="w-full sm:w-auto">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}