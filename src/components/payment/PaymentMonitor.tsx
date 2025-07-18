"use client";

import React, { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Copy } from 'lucide-react';

interface PaymentStatus {
  orderId: string;
  status: 'pending' | 'paid' | 'failed';
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
  autoConfirmed?: boolean;
}

interface PaymentMonitorProps {
  orderId: string;
  onPaymentConfirmed?: () => void;
  onClose?: () => void;
}

export function PaymentMonitor({ orderId, onPaymentConfirmed, onClose }: PaymentMonitorProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    orderId,
    status: 'pending'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!orderId) return;

    const orderRef = ref(db, `orders/${orderId}`);
    
    const handleStatusChange = (snapshot: any) => {
      if (snapshot.exists()) {
        const orderData = snapshot.val();
        
        if (orderData.paymentDetails?.autoConfirmed) {
          setPaymentStatus({
            orderId,
            status: 'paid',
            amount: orderData.paymentDetails.amount,
            paymentMethod: orderData.paymentDetails.method,
            paidAt: orderData.paymentDetails.paidAt,
            autoConfirmed: true
          });
          
          toast({
            title: "✅ Thanh toán thành công!",
            description: `Đơn hàng ${orderId} đã được thanh toán và xác nhận tự động.`,
            duration: 5000
          });
          
          onPaymentConfirmed?.();
        } else if (orderData.orderStatus === 'Hoàn thành') {
          setPaymentStatus({
            orderId,
            status: 'paid',
            amount: orderData.totalAmount,
            paymentMethod: orderData.paymentMethod
          });
          
          toast({
            title: "✅ Đơn hàng hoàn thành!",
            description: `Đơn hàng ${orderId} đã được xác nhận và hoàn thành.`,
            duration: 5000
          });
          
          onPaymentConfirmed?.();
        }
      }
    };

    onValue(orderRef, handleStatusChange);

    return () => {
      off(orderRef, 'value', handleStatusChange);
    };
  }, [orderId, onPaymentConfirmed, toast]);

  const copyOrderId = () => {
    navigator.clipboard?.writeText(orderId);
    toast({
      title: "Đã sao chép",
      description: "Mã đơn hàng đã được sao chép vào clipboard",
      duration: 2000
    });
  };

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'paid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus.status) {
      case 'paid':
        return paymentStatus.autoConfirmed 
          ? "Thanh toán thành công (Tự động xác nhận)"
          : "Đơn hàng đã hoàn thành";
      case 'failed':
        return "Thanh toán thất bại";
      default:
        return "Đang chờ thanh toán...";
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus.status) {
      case 'paid':
        return paymentStatus.autoConfirmed
          ? `Đã nhận ${paymentStatus.amount?.toLocaleString('vi-VN')} VNĐ vào lúc ${paymentStatus.paidAt ? new Date(paymentStatus.paidAt).toLocaleString('vi-VN') : 'N/A'}`
          : "Cảm ơn bạn đã mua hàng!";
      case 'failed':
        return "Vui lòng thử lại hoặc liên hệ hỗ trợ";
      default:
        return "Hệ thống sẽ tự động xác nhận khi nhận được thanh toán";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {getStatusIcon()}
        </div>
        <CardTitle className="text-lg">{getStatusText()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          {getStatusDescription()}
        </p>
        
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
            <p className="font-mono text-sm font-medium">{orderId}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyOrderId}
            className="p-2"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {paymentStatus.status === 'pending' && (
          <div className="text-center">
            <div className="flex justify-center space-x-1 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Đang theo dõi thanh toán...
            </p>
          </div>
        )}

        {onClose && (
          <Button
            variant={paymentStatus.status === 'paid' ? 'default' : 'outline'}
            onClick={onClose}
            className="w-full"
          >
            {paymentStatus.status === 'paid' ? 'Hoàn thành' : 'Đóng'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
