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
      <DialogContent className="sm:max-w-[500px] md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="flex items-center justify-center gap-3 text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            <span className="text-3xl animate-spin">💰</span>
            Đổi Điểm Thưởng
            <span className="text-3xl animate-spin">💰</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-medium">
              Chọn phần thưởng bạn muốn đổi bằng điểm tích lũy! 🎁
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
              <p className="text-sm text-slate-600 mb-2">💎 Điểm hiện tại của bạn</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {currentPoints.toLocaleString('vi-VN')}
                </span>
                <span className="text-lg text-slate-600 font-medium">điểm</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ≈ {(currentPoints * 1000).toLocaleString('vi-VN')} VNĐ đã chi tiêu
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REDEMPTION_OPTIONS.map((option, index) => {
              const canAfford = currentPoints >= option.points;
              const meetsMinOrder = cartTotal >= option.minOrder;
              const isEligible = canAfford && meetsMinOrder;

              return (
                <Card
                  key={option.points}
                  className={cn(
                    "text-center p-4 transition-all duration-300 border-2 cursor-pointer relative overflow-hidden",
                    isEligible ? 
                      "hover:shadow-xl hover:-translate-y-2 hover:scale-105 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50" : 
                      "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50",
                    index === 0 ? "bg-gradient-to-br from-green-50 to-emerald-50" :
                    index === 1 ? "bg-gradient-to-br from-blue-50 to-cyan-50" :
                    index === 2 ? "bg-gradient-to-br from-purple-50 to-pink-50" :
                    "bg-gradient-to-br from-orange-50 to-red-50"
                  )}
                  onClick={() => isEligible && onRedeem(option.points, option.value)}
                >
                  {isEligible && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                        ✨ AVAILABLE
                      </span>
                    </div>
                  )}
                  <CardContent className="p-0 space-y-3">
                    <div className={cn(
                      "text-4xl md:text-5xl mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2",
                      index === 0 ? "bg-green-100" :
                      index === 1 ? "bg-blue-100" :
                      index === 2 ? "bg-purple-100" :
                      "bg-orange-100"
                    )}>
                      {index === 0 ? '🎫' : index === 1 ? '💎' : index === 2 ? '👑' : '🏆'}
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-slate-800">
                        {(option.value / 1000).toLocaleString('vi-VN')}K VNĐ
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        Phiếu giảm giá
                      </p>
                    </div>
                    <div className={cn(
                      "inline-block px-4 py-2 rounded-full text-white font-bold text-lg shadow-md",
                      index === 0 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                      index === 1 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                      index === 2 ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                      "bg-gradient-to-r from-orange-500 to-red-500"
                    )}>
                      {option.points.toLocaleString('vi-VN')} điểm
                    </div>
                    <div className="space-y-1 text-xs">
                      {!canAfford && (
                        <p className="text-red-500 font-medium">
                          ❌ Không đủ điểm (thiếu {(option.points - currentPoints).toLocaleString('vi-VN')})
                        </p>
                      )}
                      {!meetsMinOrder && (
                        <p className="text-orange-500 font-medium">
                          ⚠️ Đơn tối thiểu {(option.minOrder / 1000).toLocaleString('vi-VN')}K
                        </p>
                      )}
                      {isEligible && (
                        <p className="text-green-600 font-medium">
                          ✅ Sẵn sàng đổi!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
            <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
              💡 Lưu ý quan trọng
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>1,000 VNĐ</strong> chi tiêu = <strong>1 điểm</strong> tích lũy</li>
              <li>• Điểm được nhân với hệ số theo hạng VIP</li>
              <li>• Phiếu giảm giá chỉ áp dụng cho đơn hàng đủ điều kiện</li>
            </ul>
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
