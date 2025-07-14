"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import type { ShopInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { WavingHand } from '@/components/illustrations/WavingHand';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, currentUser, loading: authLoading, error, setError } = useAuth();
  const router = useRouter();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribe = onValue(shopInfoRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopInfo(snapshot.val());
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
        router.push('/');
      }
    } catch (err) {
      // The error is already set in the AuthContext, but we can log it here if needed.
      console.error("An unexpected error occurred during sign-in:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading && !currentUser) { // Show loading screen only if not yet authenticated
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <LoadingSpinner size={48} className="mb-4" />
            <p className="text-lg text-foreground">Đang tải ứng dụng...</p>
        </div>
    );
  }

  if (currentUser) { // If user is already logged in, redirect
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Đang chuyển hướng...</p>
        </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <div className="mx-auto h-[150px] w-[150px] text-primary flex items-center justify-center rounded-full bg-primary/10 animate-logo-pulse">
                {isLoadingShopInfo ? (
                  <Skeleton className="h-[150px] w-[150px] rounded-full" />
                ) : shopInfo?.logoUrl ? (
                  <Image
                    src={shopInfo.logoUrl}
                    alt="Shop Logo"
                    width={150}
                    height={150}
                    className="h-[150px] w-[150px] rounded-full object-contain"
                    priority
                  />
                ) : (
                  <HomeIcon className="h-24 w-24" />
                )}
              </div>
              <div className="absolute bottom-0 -right-10">
                <WavingHand className="text-6xl" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-pink-400 animate-welcome-text">Cửa Hàng Hoa Công Nguyệt</h1>
          <p className="text-muted-foreground mt-2">Hoa Tươi Mỗi Ngày - Hạnh Phúc Đong Đầy</p>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <div className="p-6 pt-0 text-center text-sm">
             <p>
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-bold text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
        </div>
      </Card>
    </div>
  );
}
