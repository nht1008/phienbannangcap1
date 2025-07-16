"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomerAccountDialog } from './CustomerAccountDialog';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import type { Customer } from '@/types';

interface CustomerAccountFloatingButtonProps {
  customer: Customer | null;
  className?: string;
}

export function CustomerAccountFloatingButton({ 
  customer, 
  className = "" 
}: CustomerAccountFloatingButtonProps) {
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const { currentUser } = useAuth();

  // Chỉ hiển thị nếu có customer (user đã đăng nhập với role customer)
  if (!customer || !currentUser) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsAccountDialogOpen(true)}
            size="lg"
            className={`
              fixed bottom-6 right-6 z-50 
              h-14 w-14 rounded-full 
              bg-primary hover:bg-primary/90 
              text-primary-foreground 
              shadow-lg hover:shadow-xl 
              transition-all duration-200 
              border-2 border-background
              ${className}
            `}
            aria-label="Thông tin tài khoản"
          >
            <User className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="mr-2">
          <p>Thông tin tài khoản</p>
        </TooltipContent>
      </Tooltip>

      {/* Account Dialog */}
      <CustomerAccountDialog
        isOpen={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        customer={customer}
        currentUserEmail={currentUser?.email || undefined}
        currentUserName={currentUser?.displayName || undefined}
        currentUserPhotoURL={currentUser?.photoURL || undefined}
        onProfileUpdate={(name, photoURL) => {
          // Có thể thêm logic refresh user data nếu cần
          console.log('Profile updated:', { name, photoURL });
        }}
      />
    </>
  );
}
