"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsDialog } from '@/components/auth/TermsDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerIcon } from '@/components/icons/CustomerIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { RegistrationRequestDialog } from '@/components/auth/RegistrationRequestDialog';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zaloName, setZaloName] = useState('');
  const [role, setRole] = useState<'customer' | 'employee' | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Vui lòng chọn vai trò của bạn.");
      return;
    }
    if (!fullName || !email || !password || !phone || !address) {
      setError("Vui lòng điền đầy đủ các trường có dấu (*).");
      return;
    }
    if (role === 'customer' && !zaloName) {
      setError("Vui lòng điền tên Zalo cho vai trò Khách hàng.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu và mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeToTerms) {
      setError("Bạn phải đồng ý với các điều khoản và điều kiện.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          address,
          role,
          zaloName: role === 'customer' ? zaloName : '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi không xác định.');
      }

      // Reset form and show success dialog
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setAddress('');
      setZaloName('');
      setRole(null);
      setAgreeToTerms(false);
      setShowSuccessDialog(true);

    } catch (err: any) {
      console.error("Registration request error:", err);
      setError(err.message || "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <RegistrationRequestDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-lg p-8 space-y-6 bg-card rounded-lg shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Tạo tài khoản mới</h1>
            <p className="mt-2 text-muted-foreground">Tham gia cùng chúng tôi ngay hôm nay!</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại <span className="text-destructive">*</span></Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ <span className="text-destructive">*</span></Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Bạn là? <span className="text-destructive">*</span></Label>
              <RadioGroup value={role ?? ""} onValueChange={(value) => setRole(value as 'customer' | 'employee')} className="flex space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="r-customer" />
                  <Label htmlFor="r-customer" className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                    <CustomerIcon className="h-5 w-5 text-muted-foreground" />
                    Khách hàng
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employee" id="r-employee" />
                  <Label htmlFor="r-employee" className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                    <EmployeeIcon className="h-5 w-5 text-muted-foreground" />
                    Nhân viên
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {role === 'customer' && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="zaloName">Tên Zalo <span className="text-destructive">*</span></Label>
                <Input id="zaloName" value={zaloName} onChange={(e) => setZaloName(e.target.value)} required />
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Tôi đồng ý với các{' '}
                <TermsDialog>
                  <span className="font-bold text-primary hover:underline cursor-pointer">
                    điều khoản và điều kiện
                  </span>
                </TermsDialog>
              </label>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

            <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isSubmitting ? 'Đang gửi yêu cầu...' : 'Đăng ký'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p>
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
    </div>
   </>
  );
}