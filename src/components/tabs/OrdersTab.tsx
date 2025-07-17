"use client";

import React, { useState, useMemo } from 'react';
import type { Order, OrderItem, OrderStatus } from '@/types';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, PackageCheck, ReceiptText, Edit3, Ban, X } from 'lucide-react';
import { formatPhoneNumber, cn, normalizeStringForSearch, formatCurrencyForUser } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import CancellationReasonDialog from '@/components/orders/CancellationReasonDialog';
import { NoDataIllustration } from '@/components/illustrations/NoDataIllustration';

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, employeeId: string, employeeName: string) => Promise<void>;
  currentUser: User | null;
  hasFullAccessRights: boolean;
  onConfirmCancel: (order: Order, reason: string) => void;
  isCurrentUserCustomer?: boolean;
}

const getStatusBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Chờ xác nhận':
    case 'Yêu cầu hủy':
      return 'default';
    case 'Hoàn thành':
      return 'default';
    case 'Đã hủy':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusColorClass = (status: OrderStatus): string => {
    switch (status) {
        case 'Chờ xác nhận': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
        case 'Hoàn thành': return 'bg-green-500/20 text-green-700 border-green-500';
        case 'Đã hủy': return 'bg-red-500/20 text-red-700 border-red-500';
        case 'Yêu cầu hủy': return 'bg-orange-500/20 text-orange-700 border-orange-500';
        default: return 'bg-gray-300/20 text-gray-600 border-gray-400';
    }
};

const ALL_ORDER_STATUSES: OrderStatus[] = ['Chờ xác nhận', 'Hoàn thành', 'Đã hủy', 'Yêu cầu hủy'];

export function OrdersTab({ orders, onUpdateStatus, currentUser, hasFullAccessRights, onConfirmCancel, isCurrentUserCustomer = false }: OrdersTabProps) {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const [orderToConfirmCancel, setOrderToConfirmCancel] = useState<Order | null>(null);
  const { toast } = useToast();

  const customerCancellationReasons = [
    "Thay đổi ý định mua hàng",
    "Tìm thấy lựa chọn tốt hơn",
    "Vấn đề về thanh toán",
  ];

  const adminCancellationReasons = [
    "Sản phẩm hết hàng",
    "Thông tin khách hàng không chính xác",
  ];

  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleCancelSubmit = (reason: string) => {
    if (orderToCancel) {
      try {
        onConfirmCancel(orderToCancel, reason);
        toast({ title: "Thành công", description: "Đã gửi yêu cầu hủy đơn hàng." });
      } catch (error) {
        console.error("Error requesting order cancellation:", error);
        toast({ title: "Lỗi", description: "Không thể gửi yêu cầu hủy.", variant: "destructive" });
      }
    }
    setCancelDialogOpen(false);
    setOrderToCancel(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) {
      toast({ title: "Lỗi", description: "Vui lòng đăng nhập để thực hiện thao tác này.", variant: "destructive" });
      return;
    }
    if (!hasFullAccessRights && !(newStatus === 'Yêu cầu hủy' || newStatus === 'Chờ xác nhận')) {
        toast({ title: "Không có quyền", description: "Bạn không có quyền thay đổi trạng thái này.", variant: "destructive"});
        return;
    }
    try {
      await onUpdateStatus(orderId, newStatus, currentUser.uid, currentUser.displayName || currentUser.email || "Không rõ");
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái đơn hàng thành "${newStatus}".` });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái đơn hàng.", variant: "destructive" });
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-bold">Quản lý Đơn hàng ({orders.length})</CardTitle>
          <CardDescription className="text-sm md:text-base">Xem và quản lý các đơn hàng từ khách hàng.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="flex flex-col items-center gap-4">
                <NoDataIllustration />
                <h3 className="text-lg md:text-xl font-semibold">Chưa có đơn hàng</h3>
                <p className="text-muted-foreground text-sm md:text-base">Hiện tại không có đơn hàng nào để hiển thị.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <ScrollArea className="max-h-[calc(100vh-18rem)] no-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>ID Đơn hàng</TableHead>
                        {hasFullAccessRights && <TableHead>Khách hàng</TableHead>}
                        <TableHead>Thời gian đặt</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        {hasFullAccessRights && <TableHead className="text-center">Hoàn thành</TableHead>}
                        <TableHead className="text-center">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, index) => (
                        <TableRow key={order.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell
                            onClick={() => {
                              if (typeof window !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(order.id);
                                toast({ title: 'Đã sao chép', description: `ID đơn hàng ${order.id} đã được sao chép vào bộ nhớ tạm.` });
                              }
                            }}
                            className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center gap-2"
                          >
                            {order.id}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 15.75v1.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25h-1.5M15.75 8.25v-1.5a2.25 2.25 0 00-2.25-2.25h-6a2.25 2.25 0 00-2.25 2.25v6a2.25 2.25 0 002.25 2.25h1.5"
                              />
                            </svg>
                          </TableCell>
                          {hasFullAccessRights && <TableCell className="font-medium text-primary text-lg">{order.customerName}</TableCell>}
                          <TableCell>{new Date(order.orderDate).toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="text-right font-bold text-xl">
                            <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                              {formatCurrencyForUser(order.totalAmount, isCurrentUserCustomer)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {hasFullAccessRights ? (
                                <>
                                    {order.orderStatus === 'Yêu cầu hủy' ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setOrderToConfirmCancel(order)}
                                            className="h-8 text-xs"
                                        >
                                            Xác nhận hủy
                                        </Button>
                                    ) : (
                                        order.orderStatus === 'Chờ xác nhận' || order.orderStatus === 'Đã hủy' || order.orderStatus === 'Hoàn thành' ? (
                                            <Badge variant={getStatusBadgeVariant(order.orderStatus)} className={cn("text-xs", getStatusColorClass(order.orderStatus))}>
                                                {order.orderStatus}
                                            </Badge>
                                        ) : (
                                            <Select
                                                value={order.orderStatus}
                                                onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                                            >
                                            <SelectTrigger className={cn("h-8 text-xs w-auto min-w-[140px] border-0 shadow-none focus:ring-0", getStatusColorClass(order.orderStatus))}>
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_ORDER_STATUSES.map(statusVal => (
                                                <SelectItem key={statusVal} value={statusVal} className="text-xs" disabled={statusVal === 'Yêu cầu hủy' || statusVal === 'Chờ xác nhận'}>
                                                    {statusVal}
                                                </SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                        )
                                    )}
                                </>
                            ) : (
                                 <Badge variant={getStatusBadgeVariant(order.orderStatus)} className={cn("text-xs", getStatusColorClass(order.orderStatus))}>
                                    {order.orderStatus}
                                </Badge>
                            )}
                          </TableCell>
                          {hasFullAccessRights && (
                            <TableCell className="text-center">
                              {order.orderStatus === 'Chờ xác nhận' && (
                                  <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => setOrderToConfirm(order)}
                                      className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  >
                                      Hoàn thành
                                  </Button>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                onClick={() => setSelectedOrderDetails(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive/80"
                                onClick={() => handleCancelClick(order)}
                                disabled={order.orderStatus === 'Hoàn thành' || order.orderStatus === 'Đã hủy' || order.orderStatus === 'Yêu cầu hủy'}
                                title="Yêu cầu hủy đơn hàng"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <ScrollArea className="max-h-[calc(100vh-18rem)] no-scrollbar">
                  <div className="space-y-3">
                    {orders.map((order, index) => (
                      <Card key={order.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">#{index + 1}</span>
                                  <span 
                                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 break-all"
                                    onClick={() => {
                                      if (typeof window !== 'undefined' && navigator.clipboard) {
                                        navigator.clipboard.writeText(order.id);
                                        toast({ title: 'Đã sao chép', description: `ID đơn hàng ${order.id} đã được sao chép vào bộ nhớ tạm.` });
                                      }
                                    }}
                                    title="Nhấn để sao chép ID đơn hàng"
                                  >
                                    ID: {order.id}
                                  </span>
                                </div>
                                {hasFullAccessRights && (
                                  <p className="text-sm font-medium text-primary">{order.customerName}</p>
                                )}
                                <p className="text-xs text-muted-foreground">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <div className="text-right">
                                <span className="bg-green-500 text-white rounded px-2 py-1 text-sm font-bold">{formatCurrencyForUser(order.totalAmount, isCurrentUserCustomer)}</span>
                                <Badge variant={getStatusBadgeVariant(order.orderStatus)} className={cn("text-xs mt-1 block", getStatusColorClass(order.orderStatus))}>
                                  {order.orderStatus}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2 border-t border-border">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => setSelectedOrderDetails(order)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Chi tiết
                              </Button>
                              
                              {hasFullAccessRights && order.orderStatus === 'Chờ xác nhận' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setOrderToConfirm(order)}
                                  className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Hoàn thành
                                </Button>
                              )}
                              
                              {hasFullAccessRights && order.orderStatus === 'Yêu cầu hủy' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setOrderToConfirmCancel(order)}
                                  className="h-8 text-xs"
                                >
                                  Xác nhận hủy
                                </Button>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleCancelClick(order)}
                                disabled={order.orderStatus === 'Hoàn thành' || order.orderStatus === 'Đã hủy' || order.orderStatus === 'Yêu cầu hủy'}
                                title="Yêu cầu hủy đơn hàng"
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] w-full flex flex-col">
            <DialogHeader className="pb-2 flex-shrink-0">
              <DialogTitle className="text-lg sm:text-xl flex items-center">
                <ReceiptText className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span 
                  className="truncate cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    if (typeof window !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(selectedOrderDetails.id);
                      toast({ title: 'Đã sao chép', description: `ID đơn hàng ${selectedOrderDetails.id} đã được sao chép vào bộ nhớ tạm.` });
                    }
                  }}
                  title="Nhấn để sao chép ID đơn hàng"
                >
                  Chi tiết Đơn hàng #{selectedOrderDetails.id}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded">
                Thời gian đặt: {new Date(selectedOrderDetails.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-2 flex-shrink-0" />
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-2 no-scrollbar">
                <h4 className="font-semibold mb-3 text-foreground text-sm sm:text-base bg-yellow-100 text-yellow-800 px-3 py-2 rounded">Danh sách sản phẩm</h4>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Ảnh</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Thuộc tính</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderDetails.items.map((item, idx) => (
                      <TableRow key={`${item.id}-${idx}`}>
                        <TableCell>
                          <Image
                            src={(item.images && item.images[0]) || `https://placehold.co/40x40.png`}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover aspect-square"
                            data-ai-hint={`${item.name.split(' ')[0]} flower`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png';
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.notes && <p className="text-xs text-blue-600">Ghi chú: {item.notes}</p>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {[
                              item.color,
                              item.quality && item.quality.trim() !== '' && item.quality,
                              item.size
                            ].filter(Boolean).map((attr, index) => (
                              <div key={index} className="text-sm">{attr}</div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantityInCart}</TableCell>
                        <TableCell className="text-right">{formatCurrencyForUser(item.price, isCurrentUserCustomer)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrencyForUser(item.price * item.quantityInCart, isCurrentUserCustomer)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {selectedOrderDetails.items.map((item, idx) => (
                  <Card key={`${item.id}-${idx}`} className="border border-border">
                    <CardContent className="p-3">
                      <div className="flex gap-2">
                        <Image
                          src={(item.images && item.images[0]) || `https://placehold.co/50x50.png`}
                          alt={item.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover flex-shrink-0"
                          style={{ width: '50px', height: '50px' }}
                          data-ai-hint={`${item.name.split(' ')[0]} flower`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/50x50.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h5>
                          {item.notes && (
                            <p className="text-xs text-blue-600 mb-1">Ghi chú: {item.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mb-1">
                            {[
                              item.color,
                              item.quality && item.quality.trim() !== '' && item.quality,
                              item.size
                            ].filter(Boolean).map((attr, index) => (
                              <span key={index} className="bg-muted px-1 py-0.5 rounded text-xs">{attr}</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">Đơn vị: {item.unit}</div>
                        </div>
                        <div className="text-right flex-shrink-0 text-xs">
                          <div className="font-medium mb-1">SL: {item.quantityInCart}</div>
                          <div className="text-muted-foreground mb-1">{formatCurrencyForUser(item.price, isCurrentUserCustomer)}</div>
                          <div className="text-sm font-bold text-primary">
                            {formatCurrencyForUser(item.price * item.quantityInCart, isCurrentUserCustomer)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-medium">{formatCurrencyForUser(selectedOrderDetails.subTotal, isCurrentUserCustomer)}</span>
                </div>
                {(selectedOrderDetails.overallDiscount || 0) > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Giảm giá:</span>
                    <span className="font-medium">- {formatCurrencyForUser(selectedOrderDetails.overallDiscount || 0, isCurrentUserCustomer)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold text-primary bg-green-100 text-green-800 px-3 py-2 rounded">
                  <span>Tổng cộng:</span>
                  <span className="bg-green-600 text-white px-2 py-1 rounded">
                    {formatCurrencyForUser(selectedOrderDetails.totalAmount, isCurrentUserCustomer)}
                  </span>
                </div>
              </div>
              </ScrollArea>
            </div>
            <DialogFooter className="mt-3 pt-3 border-t flex-shrink-0">
              <Button variant="outline" onClick={() => setSelectedOrderDetails(null)} className="w-full sm:w-auto">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
     {orderToCancel && (
       <CancellationReasonDialog
         isOpen={isCancelDialogOpen}
         onClose={() => setCancelDialogOpen(false)}
         onSubmit={handleCancelSubmit}
         reasons={hasFullAccessRights ? adminCancellationReasons : customerCancellationReasons}
         userType={hasFullAccessRights ? "admin" : "customer"}
       />
     )}

      {orderToConfirm && (
        <AlertDialog open={!!orderToConfirm} onOpenChange={() => setOrderToConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hoàn thành đơn hàng?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn đã nhận đúng thông tin chuyển khoản từ khách hàng <span className="font-bold">{orderToConfirm.customerName}</span> với số tiền là <span className="font-bold">{formatCurrencyForUser(orderToConfirm.totalAmount, isCurrentUserCustomer)}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleStatusChange(orderToConfirm.id, 'Hoàn thành')}>Xác nhận</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {orderToConfirmCancel && (
        <AlertDialog open={!!orderToConfirmCancel} onOpenChange={() => setOrderToConfirmCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hủy đơn hàng?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này sẽ xóa đơn hàng khỏi hệ thống.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Không</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleStatusChange(orderToConfirmCancel.id, 'Đã hủy')}>Hủy đơn hàng</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
