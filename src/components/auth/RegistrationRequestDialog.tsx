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

interface RegistrationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegistrationRequestDialog({ open, onOpenChange }: RegistrationRequestDialogProps) {
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
            Yêu cầu tạo tài khoản của bạn đã được gửi đến quản trị viên để xét duyệt. Vui lòng kiểm tra email hoặc chờ thông báo để biết kết quả.
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
