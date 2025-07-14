"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface ForgotPasswordRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordRequestDialog({ open, onOpenChange }: ForgotPasswordRequestDialogProps) {
  const router = useRouter();

  const handleRedirect = () => {
    onOpenChange(false);
    router.push('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-2xl">Yêu cầu đã được gửi thành công!</DialogTitle>
          <DialogDescription className="pt-2">
            Một email đặt lại mật khẩu đã được gửi đến bạn. Vui lòng kiểm tra hộp thư.
            <br />
            <span className="text-xs font-semibold text-yellow-500">Nếu không tìm thấy, hãy kiểm tra mục thư rác (spam).</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={handleRedirect}>
            Về trang Đăng nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}