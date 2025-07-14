"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { ForgotPasswordRequestDialog } from '@/components/auth/ForgotPasswordRequestDialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError("Vui lòng nhập email của bạn.");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setIsDialogOpen(true);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Đặt lại mật khẩu</h1>
            <p className="mt-2 text-muted-foreground">Đừng lo lắng, chúng tôi sẽ giúp bạn.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
            <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
              {loading ? <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> : null}
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <p>
              Đã nhớ mật khẩu?{' '}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
           <div className="mt-4 text-center">
              <Button variant="ghost" asChild size="sm">
                  <Link href="/">
                       Quay về trang chủ
                  </Link>
              </Button>
          </div>
        </div>
      </div>
      <ForgotPasswordRequestDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}