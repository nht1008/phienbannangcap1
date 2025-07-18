"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HomeIcon } from '@/components/icons/HomeIcon';
import Image from 'next/image';
import Link from 'next/link';
import type { ShopInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthDialogsProps {
  shopInfo?: ShopInfo | null;
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  isLoadingShopInfo?: boolean;
}

export default function AuthDialogs({
  shopInfo,
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onSwitchToRegister,
  onSwitchToLogin,
  isLoadingShopInfo = false
}: AuthDialogsProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const { signIn, signUp, loading: authLoading, error, setError } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
        setError({ code: "auth/missing-fields", message: "Vui lòng nhập email và mật khẩu." } as any);
        return;
    }
    setIsSubmitting(true);
    try {
      const user = await signIn(loginEmail, loginPassword);
      if (user) {
        onLoginClose();
        router.push('/');
      }
    } catch (err) {
      console.error("An unexpected error occurred during sign-in:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!registerEmail || !registerPassword || !registerName || !registerPhone) {
        setError({ code: "auth/missing-fields", message: "Vui lòng điền đầy đủ thông tin." } as any);
        return;
    }
    setIsSubmitting(true);
    try {
      const user = await signUp(registerEmail, registerPassword, registerName, registerPhone);
      if (user) {
        onRegisterClose();
        router.push('/');
      }
    } catch (err) {
      console.error("An unexpected error occurred during sign-up:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearLoginForm = () => {
    setLoginEmail('');
    setLoginPassword('');
    setError(null);
  };

  const clearRegisterForm = () => {
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterName('');
    setRegisterPhone('');
    setError(null);
  };

  const formatError = (error: any) => {
    if (!error) return '';
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
    } else if (error.code === 'auth/user-disabled') {
      return 'Tài khoản của bạn đã được đăng ký nhưng đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.';
    } else if (error.message === 'Firebase: Error (auth/network-request-failed).') {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
    } else if (error.code === 'auth/email-already-in-use') {
      return 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.';
    } else if (error.code === 'auth/weak-password') {
      return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
    } else if (error.code === 'auth/invalid-email') {
      return 'Email không hợp lệ. Vui lòng kiểm tra lại.';
    }
    return error.message;
  };

  return (
    <>
      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={(open) => {
        if (!open) {
          onLoginClose();
          clearLoginForm();
        }
      }}>
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
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="ban@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mật khẩu</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
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
                {formatError(error)}
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
              <button 
                className="font-bold text-primary hover:underline"
                onClick={() => {
                  onLoginClose();
                  clearLoginForm();
                  onSwitchToRegister();
                }}
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => {
        if (!open) {
          onRegisterClose();
          clearRegisterForm();
        }
      }}>
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
                  <DialogTitle className="text-xl text-purple-600">Đăng ký</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Tạo tài khoản mới để bắt đầu mua sắm
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">Họ và tên</Label>
              <Input
                id="register-name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="ban@email.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-phone">Số điện thoại</Label>
              <Input
                id="register-phone"
                type="tel"
                placeholder="0912345678"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Mật khẩu</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md border border-destructive/50">
                {formatError(error)}
              </p>
            )}
            <Button type="submit" className="w-full text-lg py-3 bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size={20} className="mr-2" />
                  Đang đăng ký...
                </>
              ) : 'Đăng ký'}
            </Button>
          </form>
          
          <div className="text-center text-sm border-t pt-4">
            <p>
              Đã có tài khoản?{' '}
              <button 
                className="font-bold text-primary hover:underline"
                onClick={() => {
                  onRegisterClose();
                  clearRegisterForm();
                  onSwitchToLogin();
                }}
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
