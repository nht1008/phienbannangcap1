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
    <div className="min-h-screen bg-background">
      {/* Hiển thị PreAuthStorefront với overlay nút đăng nhập */}
      <PreAuthStorefront shopInfo={shopInfo} storeLogo={storeLogo} />
      
      {/* Nút đăng nhập nổi */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={openLoginDialog}
          className="bg-red-500 text-white hover:bg-red-600 shadow-lg"
          size="lg"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Đăng nhập
        </Button>
      </div>

      {/* Dialog đăng nhập */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 text-primary flex items-center justify-center rounded-full bg-primary/10">
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
                      <HomeIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-xl text-pink-400">Đăng nhập</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Đăng nhập để bắt đầu mua sắm
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="text-right text-sm">
              <Link href="/forgot-password" className="underline text-muted-foreground hover:text-primary">
                Quên mật khẩu?
              </Link>
            </div>
            {error && (
              <p className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md border border-destructive/50">
                {error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
                  ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
                  : error.code === 'auth/user-disabled'
                  ? 'Tài khoản của bạn đã được đăng ký nhưng đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.'
                  : error.message === 'Firebase: Error (auth/network-request-failed).'
                  ? 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
                  : error.message}
              </p>
            )}
            <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={20} className="mr-2" />
                  Đang đăng nhập...
                </>
              ) : 'Đăng nhập'}
            </Button>
          </form>
          
          <div className="text-center text-sm border-t pt-4">
            <p>
              Chưa có tài khoản?{' '}
              <Link 
                href="/register" 
                className="font-bold text-primary hover:underline"
                onClick={() => setIsLoginDialogOpen(false)}
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
