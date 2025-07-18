"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { WavingHand } from '@/components/illustrations/WavingHand';
import { LogIn, X } from 'lucide-react';
import PreAuthStorefront from '@/components/storefront/PreAuthStorefront';
import { FloatingFlowers } from '@/components/animations/FloatingFlowers';
import { IncentiveBanner } from '@/components/shared/IncentiveBanner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, currentUser, loading: authLoading, error, setError } = useAuth();
  const router = useRouter();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [storeLogo, setStoreLogo] = useState<string>('');
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  useEffect(() => {
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribe = onValue(shopInfoRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setShopInfo(data);
        if (data.logoUrl) {
          setStoreLogo(data.logoUrl);
        }
      } else {
        setShopInfo(null);
      }
      setIsLoadingShopInfo(false);
    }, (error) => {
      console.error("Error fetching shop info for login page:", error);
      setIsLoadingShopInfo(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !authLoading) {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  // Mở dialog login khi có query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'login') {
      setIsLoginDialogOpen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
        setError({ code: "auth/missing-fields", message: "Vui lòng nhập email và mật khẩu." } as any);
        return;
    }
    setIsSubmitting(true);
    try {
      const user = await signIn(email, password);
      if (user) {
        setIsLoginDialogOpen(false);
        router.push('/');
      }
    } catch (err) {
      console.error("An unexpected error occurred during sign-in:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLoginDialog = () => {
    setIsLoginDialogOpen(true);
    setError(null);
    setEmail('');
    setPassword('');
  };

  if (authLoading && !currentUser) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <LoadingSpinner size={48} className="mb-4" />
            <p className="text-lg text-foreground">Đang tải ứng dụng...</p>
        </div>
    );
  }

  if (currentUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Floating flowers animation */}
      <FloatingFlowers />
      
      {/* Hiển thị PreAuthStorefront với hiệu ứng */}
      <div className="relative z-10">
        <PreAuthStorefront shopInfo={shopInfo} storeLogo={storeLogo} />
      </div>

      {/* Dialog đăng nhập với hiệu ứng nâng cao */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-lg border-2 border-gradient-to-r from-purple-200 to-pink-200 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 text-primary flex items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse">
                    {isLoadingShopInfo ? (
                      <Skeleton className="h-12 w-12 rounded-full" />
                    ) : shopInfo?.logoUrl ? (
                      <Image
                        src={shopInfo.logoUrl}
                        alt="Shop Logo"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-contain"
                        priority
                      />
                    ) : (
                      <HomeIcon className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                  {/* Floating sparkles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    ✨ Đăng nhập
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    Chào mừng bạn trở lại! 🌸
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {/* Incentive Banner */}
          <IncentiveBanner onOrderNow={() => {
            // Xử lý khi nhấn nút đặt hàng
            console.log("Order now clicked from incentive banner");
          }} />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-purple-200 focus:border-purple-400 rounded-lg transition-all duration-300 hover:border-purple-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-2 border-purple-200 focus:border-purple-400 rounded-lg transition-all duration-300 hover:border-purple-300"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link 
                href="/forgot-password" 
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors duration-200 font-medium"
                onClick={() => setIsLoginDialogOpen(false)}
              >
                🔐 Quên mật khẩu?
              </Link>
            </div>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg animate-shake">
                <p className="text-sm text-red-700">
                  ⚠️ {error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
                    ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
                    : error.code === 'auth/user-disabled'
                    ? 'Tài khoản của bạn đã được đăng ký nhưng đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.'
                    : error.message === 'Firebase: Error (auth/network-request-failed).'
                    ? 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
                    : error.message}
                </p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full text-lg py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all duration-300 font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={20} className="mr-2" />
                  🔄 Đang đăng nhập...
                </>
              ) : '🚀 Đăng nhập ngay'}
            </Button>
          </form>
          
          <div className="text-center text-sm border-t border-purple-200 pt-4">
            <p className="text-gray-600">
              Chưa có tài khoản?{' '}
              <Link 
                href="/register" 
                className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:underline transition-all duration-200"
                onClick={() => setIsLoginDialogOpen(false)}
              >
                ✨ Đăng ký ngay
              </Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
