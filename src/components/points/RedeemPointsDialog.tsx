"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { REDEMPTION_OPTIONS } from '@/lib/points';
import type { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface RedeemPointsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer: Customer | null;
  onRedeem: (points: number, value: number) => void;
  cartTotal: number;
}

export function RedeemPointsDialog({
  isOpen,
  onOpenChange,
  customer,
  onRedeem,
  cartTotal,
}: RedeemPointsDialogProps) {
  const currentPoints = customer?.points || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi điểm thưởng</DialogTitle>
          <DialogDescription>
            Chọn một phần thưởng để đổi bằng điểm của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Điểm hiện tại của bạn</p>
            <p className="text-4xl font-bold text-primary">{currentPoints.toLocaleString('vi-VN')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {REDEMPTION_OPTIONS.map((option) => {
              const canAfford = currentPoints >= option.points;
              const meetsMinOrder = cartTotal >= option.minOrder;
              const isEligible = canAfford && meetsMinOrder;

              return (
                <Card
                  key={option.points}
                  className={cn(
                    "text-center p-4 transition-all",
                    isEligible ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isEligible && onRedeem(option.points, option.value)}
                >
                  <CardContent className="p-0">
                    <p className="text-lg font-semibold">{option.value.toLocaleString('vi-VN')} VNĐ</p>
                    <p className="text-sm text-muted-foreground">{option.points.toLocaleString('vi-VN')} điểm</p>
                    {!meetsMinOrder && (
                        <p className="text-xs text-destructive mt-1">
                            Đơn tối thiểu {option.minOrder.toLocaleString('vi-VN')}
                        </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
