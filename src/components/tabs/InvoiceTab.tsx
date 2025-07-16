"use client";

import React, { useState, useMemo } from 'react';
import type { Invoice, InvoiceCartItem } from '@/types'; // Removed Employee as it's not used here
import type { ActivityDateTimeFilter } from '@/app/page'; // Updated import
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Eye, Plus, Minus } from 'lucide-react'; // Removed Undo2
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoDataIllustration } from '@/components/illustrations/NoDataIllustration';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import { TimeRangeSlider } from '@/components/ui/time-range-slider';
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar';
import { useInvoiceSearch } from '@/hooks/use-smart-search';

interface InvoiceTabProps {
  invoices: Invoice[];
  onProcessInvoiceCancellationOrReturn: (
    invoiceId: string,
    operationType: 'delete' | 'return',
    itemsToReturn?: Array<{ productId: string; name: string; quantityToReturn: number }>
  ) => Promise<boolean>;
  filter: ActivityDateTimeFilter; // Updated type
  onFilterChange: (newFilter: ActivityDateTimeFilter) => void; // Updated type
  hasFullAccessRights: boolean;
}

type ReturnItemDetail = {
  originalItemId: string; 
  originalQuantityInCart: number;
  quantityToReturn: string;
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  price: number; 
  itemDiscount?: number; 
};

export function InvoiceTab({ invoices, onProcessInvoiceCancellationOrReturn, filter: filterProp, onFilterChange, hasFullAccessRights }: InvoiceTabProps) {
  const { toast } = useToast();
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Smart search logic
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useInvoiceSearch(invoices);

  // Apply payment method filter to search results
  const filteredInvoices = useMemo(() => {
    let results = filteredResults.map(result => result.item);
    
    if (paymentMethodFilter !== 'all') {
      results = results.filter(invoice => invoice.paymentMethod === paymentMethodFilter);
    }
    
    return results;
  }, [filteredResults, paymentMethodFilter]);

  const filterContent = (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Phương thức thanh toán</Label>
        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Chọn phương thức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
            <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
            <SelectItem value="Thẻ">Thẻ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const [isReturnItemsDialogOpen, setIsReturnItemsDialogOpen] = useState(false);
  const [currentInvoiceForReturnDialog, setCurrentInvoiceForReturnDialog] = useState<Invoice | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, ReturnItemDetail>>({});

  const openDeleteConfirmDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      const success = await onProcessInvoiceCancellationOrReturn(invoiceToDelete.id, 'delete');
      if (success) {
        toast({ title: "Thành công", description: "Đã xóa hóa đơn." });
        setInvoiceToDelete(null);
      } else {
        // Error toast will be shown by the parent function if it returns false
      }
    }
  };

  const handleReturnItemQuantityChange = (productId: string, value: string) => {
    const itemDetail = returnItemsState[productId];
    if (!itemDetail) return;

    let numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    } else if (numValue > itemDetail.originalQuantityInCart) {
      numValue = itemDetail.originalQuantityInCart;
    }

    setReturnItemsState(prev => ({
      ...prev,
      [productId]: { ...prev[productId], quantityToReturn: numValue.toString() }
    }));
  };

  const calculatedTotalRefundAmount = useMemo(() => {
    if (!currentInvoiceForReturnDialog || Object.keys(returnItemsState).length === 0) {
      return 0;
    }
    let totalRefund = 0;
    Object.values(returnItemsState).forEach(detail => {
      const quantityToReturnNum = parseInt(detail.quantityToReturn);
      if (quantityToReturnNum > 0) {
        const originalItemDiscountPerUnit = detail.originalQuantityInCart > 0 ? (detail.itemDiscount || 0) / detail.originalQuantityInCart : 0;
        const effectivePricePerUnit = detail.price + originalItemDiscountPerUnit;
        totalRefund += effectivePricePerUnit * quantityToReturnNum;
      }
    });
    return totalRefund;
  }, [returnItemsState, currentInvoiceForReturnDialog]);


  const handleConfirmSelectiveReturn = async () => {
    if (!currentInvoiceForReturnDialog) return;

    const itemsToReturnForApi = Object.values(returnItemsState)
      .map((detail) => ({
        productId: detail.originalItemId, 
        name: detail.name,
        quantityToReturn: parseInt(detail.quantityToReturn) || 0,
      }))
      .filter(item => item.quantityToReturn > 0);

    if (itemsToReturnForApi.length === 0) {
      setIsReturnItemsDialogOpen(false);
      return;
    }

    try {
      const success = await onProcessInvoiceCancellationOrReturn(currentInvoiceForReturnDialog.id, 'return', itemsToReturnForApi);
      if (success) {
        toast({ title: "Thành công", description: "Đã xử lý hoàn trả sản phẩm." });
        setIsReturnItemsDialogOpen(false);
        setCurrentInvoiceForReturnDialog(null);
        setReturnItemsState({});
      }
      // Parent function handles error toast
    } catch (error) {
      console.error("Error processing return:", error);
      toast({ title: "Lỗi", description: "Không thể xử lý hoàn trả.", variant: "destructive" });
    }
  };

  const handleDateChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      onFilterChange({
        ...filterProp,
        startDate: dateRange.from ? startOfDay(dateRange.from) : null,
        endDate: dateRange.to ? endOfDay(dateRange.to) : null,
      });
    }
  };

  const setDateRangePreset = (preset: 'today' | 'this_month' | 'last_month' | 'all_time') => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'all_time':
        from = null;
        to = null;
        break;
    }
    onFilterChange({
      ...filterProp,
      startDate: from,
      endDate: to,
      startHour: '00',
      startMinute: '00',
      endHour: '23',
      endMinute: '59',
    });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SmartSearchBar
              placeholder="Tìm kiếm hóa đơn theo khách hàng, nhân viên, sản phẩm..."
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearSearch={clearSearch}
              isSearching={isSearching}
              totalResults={totalResults}
              suggestions={[]}
              showFilters={true}
              filters={filterContent}
            />
          </div>

          <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khoảng thời gian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-card h-9",
                        !filterProp.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterProp.startDate && filterProp.endDate ? (
                        <>
                          {format(filterProp.startDate, "dd/MM/y", { locale: vi })} - {format(filterProp.endDate, "dd/MM/y", { locale: vi })}
                        </>
                      ) : (
                        <span>Chọn khoảng ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filterProp.startDate || new Date()}
                      selected={{ from: filterProp.startDate || undefined, to: filterProp.endDate || undefined }}
                      onSelect={handleDateChange}
                      numberOfMonths={2}
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Khung giờ</Label>
                <TimeRangeSlider
                  value={[
                    parseInt(filterProp.startHour) * 60 + parseInt(filterProp.startMinute),
                    Math.min(1425, parseInt(filterProp.endHour) * 60 + parseInt(filterProp.endMinute))
                  ]}
                  onValueChange={([start, end]) => {
                    const startHour = Math.floor(start / 60).toString().padStart(2, '0');
                    const startMinute = (start % 60).toString().padStart(2, '0');
                    const endHour = Math.floor(end / 60).toString().padStart(2, '0');
                    const endMinute = end >= 1425 ? '59' : (end % 60).toString().padStart(2, '0');
                    onFilterChange({ ...filterProp, startHour, startMinute, endHour, endMinute });
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button onClick={() => setDateRangePreset('today')} variant="outline" className="h-9">Hôm nay</Button>
              <Button onClick={() => setDateRangePreset('this_month')} variant="outline" className="h-9">Tháng này</Button>
              <Button onClick={() => setDateRangePreset('last_month')} variant="outline" className="h-9">Tháng trước</Button>
              <Button onClick={() => setDateRangePreset('all_time')} variant="secondary" className="h-9">Xem tất cả</Button>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <NoDataIllustration />
                <h3 className="text-xl font-semibold">Không có hóa đơn</h3>
                <p className="text-muted-foreground">Không có hóa đơn nào phù hợp với bộ lọc đã chọn.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">STT</TableHead>
                    <TableHead>ID HĐ</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-green-600">Đã thanh toán</TableHead>
                    <TableHead className="text-[hsl(var(--destructive))]">Giảm giá</TableHead>
                    <TableHead className="text-[hsl(var(--destructive))]">Tiền nợ</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => {
                    const hasDebt = invoice.debtAmount && invoice.debtAmount > 0;
                    const displayedAmount = (!hasDebt ? invoice.total : (invoice.amountPaid ?? 0));
                    const isCashPayment = invoice.paymentMethod === 'Tiền mặt';
                    const invoiceDate = new Date(invoice.date);
                    const totalItemDiscounts = invoice.items.reduce((sum: number, item: InvoiceCartItem) => sum + (item.itemDiscount || 0), 0);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{invoiceDate.toLocaleDateString('vi-VN')}</div>
                            <div className="text-muted-foreground">{invoiceDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="bg-green-600 text-white px-2 py-1 rounded">
                            {displayedAmount.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="bg-red-600 text-white px-2 py-1 rounded">
                            {totalItemDiscounts.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="bg-red-600 text-white px-2 py-1 rounded">
                            {(invoice.debtAmount ?? 0).toLocaleString('vi-VN')} VNĐ
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80" onClick={() => setSelectedInvoiceDetails(invoice)}>
                            <Eye className="h-4 w-4 mr-1" />
                          </Button>
                          {hasFullAccessRights && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => openDeleteConfirmDialog(invoice)} title="Xóa hóa đơn">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedInvoiceDetails && (
            <Dialog open={!!selectedInvoiceDetails} onOpenChange={(open) => !open && setSelectedInvoiceDetails(null)}>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Chi tiết hóa đơn #{selectedInvoiceDetails.id.substring(0,6)}...</DialogTitle>
                   <DialogDescription asChild>
                     <div>
                        <p><strong>Khách hàng:</strong> {selectedInvoiceDetails.customerName}</p>
                        <p><strong>Ngày:</strong> {new Date(selectedInvoiceDetails.date).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Giờ:</strong> {new Date(selectedInvoiceDetails.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                     </div>
                  </DialogDescription>
                </DialogHeader>
                <Separator className="my-4" />
                <ScrollArea className="max-h-60">
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
                        <TableHead className="text-right">GG SP</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoiceDetails.items.map((item: InvoiceCartItem, index: number) => (
                        <TableRow key={`${item.id}-${index}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.color}</TableCell>
                          <TableCell>{item.quality}</TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">{item.quantityInCart}</TableCell>
                          <TableCell className="text-right">{item.price.toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right text-destructive">{(item.itemDiscount || 0).toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {(item.price * item.quantityInCart - (item.itemDiscount || 0)).toLocaleString('vi-VN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-lg text-foreground">
                  <span>Tổng thanh toán HĐ:</span>
                  <span>{selectedInvoiceDetails.total.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                 {selectedInvoiceDetails.amountPaid !== undefined && (
                     <>
                        <Separator className="my-2" />
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
        </CardContent>
      </Card>

      {invoiceToDelete && hasFullAccessRights && (
        <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa hóa đơn?</AlertDialogTitle>
                <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa hóa đơn #{invoiceToDelete.id.substring(0,6)}...? Các sản phẩm trong hóa đơn này sẽ được hoàn trả lại vào kho. Công nợ liên quan (nếu có) cũng sẽ được xóa.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    Xóa hóa đơn
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {isReturnItemsDialogOpen && currentInvoiceForReturnDialog && (
        <Dialog open={isReturnItemsDialogOpen} onOpenChange={setIsReturnItemsDialogOpen}>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Hoàn trả sản phẩm cho HĐ #{currentInvoiceForReturnDialog.id.substring(0,6)}</DialogTitle>
              <DialogDescription>Chọn sản phẩm và số lượng muốn hoàn trả. Các sản phẩm sẽ được cộng lại vào kho.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>Kích thước</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">GG/SP</TableHead>
                    <TableHead className="text-center">Số lượng mua</TableHead>
                    <TableHead className="text-center w-44">Số lượng hoàn trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(returnItemsState).map(([productId, itemData]) => {
                    const perUnitDiscount = itemData.originalQuantityInCart > 0 ? (itemData.itemDiscount || 0) / itemData.originalQuantityInCart : 0;
                    return (
                      <TableRow key={productId}>
                        <TableCell className="font-medium">{itemData.name}</TableCell>
                        <TableCell className="text-xs">{itemData.color}</TableCell>
                        <TableCell className="text-xs">{itemData.quality}</TableCell>
                        <TableCell className="text-xs">{itemData.size}</TableCell>
                        <TableCell className="text-xs">{itemData.unit}</TableCell>
                        <TableCell className="text-right text-xs">{itemData.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right text-xs text-destructive">
                          {perUnitDiscount > 0 ? `${perUnitDiscount.toLocaleString('vi-VN')} VNĐ` : '-'}
                        </TableCell>
                        <TableCell className="text-center text-xs">{itemData.originalQuantityInCart}</TableCell>
                        <TableCell className="text-center w-44">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleReturnItemQuantityChange(productId, (parseInt(itemData.quantityToReturn) - 1).toString())}
                              disabled={parseInt(itemData.quantityToReturn) <= 0}
                              aria-label="Giảm số lượng hoàn trả"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              id={`return-qty-${productId}`}
                              type="number"
                              value={itemData.quantityToReturn}
                              onChange={(e) => handleReturnItemQuantityChange(productId, e.target.value)}
                              min="0"
                              max={itemData.originalQuantityInCart.toString()}
                              className="w-12 h-7 text-center text-sm hide-number-spinners px-1 bg-card"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleReturnItemQuantityChange(productId, (parseInt(itemData.quantityToReturn) + 1).toString())}
                              disabled={parseInt(itemData.quantityToReturn) >= itemData.originalQuantityInCart}
                              aria-label="Tăng số lượng hoàn trả"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
             <DialogFooter className="mt-6 sm:justify-between items-center">
              <div className="text-left mb-4 sm:mb-0">
                <p className="text-sm font-medium text-muted-foreground">Số tiền khách phải hoàn trả:</p>
                <p className="text-xl font-bold text-primary">
                  {calculatedTotalRefundAmount.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={() => setIsReturnItemsDialogOpen(false)}>Hủy</Button>
                <Button
                  onClick={handleConfirmSelectiveReturn}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={Object.values(returnItemsState).every(item => (parseInt(item.quantityToReturn) || 0) === 0)}
                >
                  Xác nhận hoàn trả
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

