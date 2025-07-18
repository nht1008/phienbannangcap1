"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Heart, Gift, Crown } from 'lucide-react';

interface IncentiveBannerProps {
  onOrderNow: () => void;
}

export const IncentiveBanner: React.FC<IncentiveBannerProps> = ({ onOrderNow }) => {
  const incentives = [
    {
      icon: <Crown className="h-6 w-6" />,
      title: "Hoa Tươi Mỗi Ngày",
      subtitle: "Đảm bảo độ tươi 100%"
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "Miễn Phí Giao Hàng",
      subtitle: "Trong nội thành Hà Nội"
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Thiết Kế Theo Yêu Cầu",
      subtitle: "Tư vấn miễn phí 24/7"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Ưu Đãi Thành Viên",
      subtitle: "Giảm giá 10% cho đơn đầu tiên"
    }
  ];

  return (
    <div className="relative">
      {/* Gradient background with animation */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 rounded-xl shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/30 to-red-400/30 animate-pulse"></div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            🎉 Chào Mừng Đến Với Vườn Hoa Tươi! 🎉
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {incentives.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-white/90">
                  {item.icon}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{item.title}</div>
                  <div className="text-white/80 text-xs">{item.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold px-8 py-3 rounded-full shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce"
              onClick={onOrderNow}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              ĐẶT HOA NGAY - GIẢM 10%!
            </Button>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-white/90 text-sm font-medium">
              ⏰ Ưu đãi có hạn - Chỉ còn hôm nay!
            </p>
          </div>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
      <div className="absolute -top-1 -right-3 w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute -bottom-2 -left-3 w-2 h-2 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};
