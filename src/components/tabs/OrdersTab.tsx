
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
import { formatPhoneNumber, cn, normalizeStringForSearch } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import CancellationReasonDialog from '@/components/orders/CancellationReasonDialog';
import { NoDataIllustration } from '@/components/illustrations/NoDataIllustration';

interface OrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, employeeId: string, employeeName: string) => Promise<void>;
  currentUser: User | null;
  hasFullAccessRights: boolean;
  onConfirmCancel: (order: Order, reason: string) => void;
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

export function OrdersTab({ orders, onUpdateStatus, currentUser, hasFullAccessRights, onConfirmCancel }: OrdersTabProps) {
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
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quản lý Đơn hàng ({orders.length})</CardTitle>
          <CardDescription>Xem và quản lý các đơn hàng từ khách hàng.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <NoDataIllustration />
                <h3 className="text-xl font-semibold">Chưa có đơn hàng</h3>
                <p className="text-muted-foreground">Hiện tại không có đơn hàng nào để hiển thị.</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-18rem)] no-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Số thứ tự</TableHead>
                    <TableHead>ID Đơn hàng</TableHead>
                    {hasFullAccessRights && <TableHead>Khách hàng</TableHead>}
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Trạng thái Đơn hàng</TableHead>
                    {hasFullAccessRights && <TableHead className="text-center">Hành động</TableHead>}
                    <TableHead className="text-center">Chi tiết</TableHead>
                    <TableHead className="text-center">Hủy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.id}</TableCell>
                      {hasFullAccessRights && <TableCell className="font-medium text-primary text-lg">{order.customerName}</TableCell>}
                      <TableCell>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right font-bold text-xl text-destructive">
                        {order.totalAmount.toLocaleString('vi-VN')} VNĐ
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => setSelectedOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <ReceiptText className="mr-2 h-6 w-6 text-primary" />
                Chi tiết Đơn hàng #{selectedOrderDetails.id}
              </DialogTitle>
              <DialogDescription>
                Ngày đặt: {new Date(selectedOrderDetails.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[65vh] pr-2 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Thông tin Khách hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Tên:</strong> {selectedOrderDetails.customerName}</p>
                            <p><strong>Số điện thoại:</strong> {formatPhoneNumber(selectedOrderDetails.customerPhone) || 'N/A'}</p>
                            <p><strong>Địa chỉ giao hàng:</strong> {selectedOrderDetails.customerAddress || 'N/A'}</p>
                             {selectedOrderDetails.internalNotes && <p><strong>Ghi chú Shop:</strong> {selectedOrderDetails.internalNotes}</p>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Thông tin Thanh toán & Vận chuyển</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Phương thức thanh toán:</strong> {selectedOrderDetails.paymentMethod || 'N/A'}</p>
                            <p><strong>Phí vận chuyển:</strong> {selectedOrderDetails.shippingFee.toLocaleString('vi-VN')} VNĐ</p>
                            {selectedOrderDetails.overallDiscount && selectedOrderDetails.overallDiscount > 0 && (
                                <p><strong>Tiền giảm giá:</strong> {selectedOrderDetails.overallDiscount.toLocaleString('vi-VN')} VNĐ</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <h4 className="font-semibold mb-2 text-foreground">Danh sách sản phẩm</h4>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-12">Ảnh</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Màu</TableHead>
                    <TableHead>Chất lượng</TableHead>
                    <TableHead>Kích thước</TableHead>
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
                            src={item.image || `https://placehold.co/40x40.png`}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover aspect-square"
                            data-ai-hint={`${item.name.split(' ')[0]} flower`}
                             onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                        />
                        </TableCell>
                        <TableCell>
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.notes && <p className="text-xs text-blue-600">Ghi chú: {item.notes}</p>}
                        </TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.quality || 'N/A'}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantityInCart}</TableCell>
                        <TableCell className="text-right">{item.price.toLocaleString('vi-VN')} VNĐ</TableCell>
                        <TableCell className="text-right font-semibold">{(item.price * item.quantityInCart).toLocaleString('vi-VN')} VNĐ</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
                <Separator className="my-4" />
                 <div className="space-y-1 text-sm text-right pr-2">
                    <p><strong>Tổng tiền hàng:</strong> {selectedOrderDetails.subTotal.toLocaleString('vi-VN')} VNĐ</p>
                    <p><strong>Phí vận chuyển:</strong> + {selectedOrderDetails.shippingFee.toLocaleString('vi-VN')} VNĐ</p>
                    {selectedOrderDetails.overallDiscount && selectedOrderDetails.overallDiscount > 0 && (
                      <p className="text-destructive"><strong>Giảm giá:</strong> - {selectedOrderDetails.overallDiscount.toLocaleString('vi-VN')} VNĐ</p>
                    )}
                    <p className="text-lg font-bold text-primary"><strong>Tổng cộng:</strong> {selectedOrderDetails.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedOrderDetails(null)}>
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
                Bạn có chắc chắn đã nhận đúng thông tin chuyển khoản từ khách hàng <span className="font-bold">{orderToConfirm.customerName}</span> với số tiền là <span className="font-bold">{orderToConfirm.totalAmount.toLocaleString('vi-VN')} VNĐ</span>?
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
