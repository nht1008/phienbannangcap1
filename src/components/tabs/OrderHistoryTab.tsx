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
import { normalizeStringForSearch, formatCompactCurrency } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface OrderHistoryTabProps {
  invoices: Invoice[];
  currentUser: User | null;
}

export function OrderHistoryTab({ invoices, currentUser }: OrderHistoryTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

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
          <CardTitle className="text-xl md:text-2xl font-bold">Lịch sử mua hàng</CardTitle>
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
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Nguồn</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Đã trả</TableHead>
                        <TableHead className="text-right">Nợ</TableHead>
                        <TableHead className="text-center">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userInvoices.map((invoice, index) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-blue-500 cursor-pointer hover:underline"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(invoice.id);
                                  }
                                }}
                              >
                                {invoice.id}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(invoice.id);
                                  }
                                }}
                                className="p-0"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  className="w-4 h-4 text-blue-500 hover:text-blue-700"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 15.75v1.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25h-1.5"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 8.25v-1.5a2.25 2.25 0 00-2.25-2.25h-6a2.25 2.25 0 00-2.25 2.25v6a2.25 2.25 0 002.25 2.25h1.5"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(invoice.date).toLocaleDateString('vi-VN')}</div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(invoice.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.orderSource === 'online' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {invoice.orderSource === 'online' ? 'Online' : 'Cửa hàng'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className="bg-blue-500 text-white rounded px-2 py-1 text-sm">{formatCompactCurrency(invoice.total)}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className="bg-green-500 text-white rounded px-2 py-1 text-sm">
                              {formatCompactCurrency((invoice.total - (invoice.debtAmount ?? 0)))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={`rounded px-2 py-1 text-sm ${
                              (invoice.debtAmount ?? 0) > 0 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {formatCompactCurrency(invoice.debtAmount ?? 0)}
                            </span>
                          </TableCell>
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
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                              <span 
                                className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 break-all"
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(invoice.id);
                                    toast({ title: 'Đã sao chép', description: `ID hóa đơn ${invoice.id} đã được sao chép vào bộ nhớ tạm.` });
                                  }
                                }}
                                title="Nhấn để sao chép ID hóa đơn"
                              >
                                ID: {invoice.id}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                {new Date(invoice.date).toLocaleDateString('vi-VN')} - {new Date(invoice.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                invoice.orderSource === 'online' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {invoice.orderSource === 'online' ? 'Online' : 'Cửa hàng'}
                              </span>
                              {(invoice.debtAmount ?? 0) > 0 && (
                                <span className="inline-block ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Nợ: {formatCompactCurrency(invoice.debtAmount ?? 0)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)} className="h-8 w-8 p-0">
                            <ListChecks className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                        <div className="text-right space-y-1">
                          <div>
                            <span className="bg-blue-500 text-white rounded px-2 py-1 text-sm font-bold">
                              Tổng: {formatCompactCurrency(invoice.total)}
                            </span>
                          </div>
                          <div>
                            <span className="bg-green-500 text-white rounded px-2 py-1 text-sm font-bold">
                              Đã trả: {formatCompactCurrency(invoice.total - (invoice.debtAmount ?? 0))}
                            </span>
                          </div>
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
              <DialogTitle 
                className="text-lg md:text-xl cursor-pointer text-blue-600 hover:text-blue-800"
                onClick={() => {
                  if (typeof window !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(selectedInvoice.id);
                    toast({ title: 'Đã sao chép', description: `ID hóa đơn ${selectedInvoice.id} đã được sao chép vào bộ nhớ tạm.` });
                  }
                }}
                title="Nhấn để sao chép ID hóa đơn"
              >
                Chi tiết hóa đơn #{selectedInvoice.id}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm space-y-1">
                  <div>Thời gian: {new Date(selectedInvoice.date).toLocaleString('vi-VN')}</div>
                  <div className="flex items-center gap-2">
                    <span>Nguồn:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedInvoice.orderSource === 'online' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedInvoice.orderSource === 'online' ? 'Online' : 'Cửa hàng'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Tổng tiền:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500 text-white">
                      {formatCompactCurrency(selectedInvoice.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Đã trả:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-500 text-white">
                      {formatCompactCurrency(selectedInvoice.total - (selectedInvoice.debtAmount ?? 0))}
                    </span>
                  </div>
                  {(selectedInvoice.debtAmount ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <span>Số tiền nợ:</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {formatCompactCurrency(selectedInvoice.debtAmount ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
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
                      <TableHead>Thuộc tính</TableHead>
                      <TableHead>ĐV</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => {
                      const attributes = [item.color, item.quality, item.size].filter(attr => attr && attr.trim() !== '');
                      const attributeText = attributes.length > 1 ? attributes.join(' - ') : attributes[0] || '';
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{attributeText}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{item.quantityInCart}</TableCell>
                          <TableCell className="text-right">{formatCompactCurrency(item.price)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCompactCurrency(item.price * item.quantityInCart)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                            <span className="text-sm font-bold text-primary ml-2">{formatCompactCurrency(item.price * item.quantityInCart)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>Màu: <span className="font-medium">{item.color}</span></div>
                            <div>Chất lượng: <span className="font-medium">{item.quality}</span></div>
                            <div>Kích thước: <span className="font-medium">{item.size}</span></div>
                            <div>Đơn vị: <span className="font-medium">{item.unit}</span></div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-border">
                            <span className="text-xs">SL: <span className="font-medium">{item.quantityInCart}</span></span>
                            <span className="text-xs">Đơn giá: <span className="font-medium">{formatCompactCurrency(item.price)}</span></span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <Separator />
            <div className="flex justify-end font-bold text-base md:text-lg">
              <span className="bg-blue-500 text-white rounded px-3 py-1">Tổng cộng: {formatCompactCurrency(selectedInvoice.total)}</span>
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