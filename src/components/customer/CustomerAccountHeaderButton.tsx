"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CustomerAccountDialog } from './CustomerAccountDialog';
import { useAuth } from '@/contexts/AuthContext';
import { User } from 'lucide-react';
import type { Customer } from '@/types';

interface CustomerAccountHeaderButtonProps {
  customer: Customer | null;
  className?: string;
}

export function CustomerAccountHeaderButton({ 
  customer, 
  className = "" 
}: CustomerAccountHeaderButtonProps) {
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const { currentUser } = useAuth();

  // Chỉ hiển thị nếu có customer (user đã đăng nhập với role customer)
  if (!customer || !currentUser) {
    return null;
  }

  return (
    <>
      {/* Header Account Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsAccountDialogOpen(true)}
            variant="ghost"
            size="sm"
            className={`
              fixed top-20 right-4 z-50 
              h-12 w-12 md:h-24 md:w-24 rounded-full 
              bg-background/80 hover:bg-background/90 
              text-foreground 
              shadow-lg hover:shadow-xl 
              transition-all duration-200 
              border border-border
              backdrop-blur-sm
              p-0
              md:top-20
              ${className}
            `}
            aria-label="Thông tin tài khoản"
          >
            <Avatar className="h-8 w-8 md:h-20 md:w-20">
              <AvatarImage 
                src={currentUser.photoURL || undefined} 
                alt={currentUser.displayName || customer.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-xl font-bold">
                {currentUser.displayName 
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : customer.name 
                    ? customer.name.charAt(0).toUpperCase()
                    : <User className="h-4 w-4 md:h-8 md:w-8" />
                }
              </AvatarFallback>
            </Avatar>
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
