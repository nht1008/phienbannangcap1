"use client";

import React, { useState } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopInfo } from '@/types';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { UserCircle, Settings, LogOut } from 'lucide-react';

type TabName = 'Bán hàng' | 'Gian hàng' | 'Kho hàng' | 'Đơn hàng' | 'Lịch sử đặt hàng' | 'Bảng xếp hạng' | 'Hóa đơn' | 'Công nợ' | 'Khách hàng' | 'Nhân viên' | 'Phân tích' | 'Đổi điểm';

interface NavItem {
  name: TabName;
  icon: React.ReactNode;
}

interface MobileNavigationProps {
  shopInfo: ShopInfo | null;
  navItems: NavItem[];
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  pendingOrdersCount: number;
  isCurrentUserCustomer: boolean;
  currentUser: User | null;
  setIsUserInfoDialogOpen: (isOpen: boolean) => void;
  setIsSettingsDialogOpen: (isOpen: boolean) => void;
  handleSignOut: () => void;
}

export const MobileNavigation = React.memo(({
  shopInfo,
  navItems,
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  isCurrentUserCustomer,
  currentUser,
  setIsUserInfoDialogOpen,
  setIsSettingsDialogOpen,
  handleSignOut,
}: MobileNavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm print:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {shopInfo?.logoUrl ? (
              <Image
                src={shopInfo.logoUrl}
                alt={shopInfo.name || "Shop Logo"}
                width={32}
                height={32}
                className="object-contain rounded"
                data-testid="mobile-logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/32x32.png';
                }}
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-primary" />
            )}
            <h1 className="text-lg font-semibold text-foreground truncate">
              {shopInfo?.name || 'Cửa hàng'}
            </h1>
          </div>

          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 h-auto"
            data-testid="mobile-menu-button"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Current Tab Indicator */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-4 h-4">
              {navItems.find(item => item.name === activeTab)?.icon}
            </span>
            <span>{activeTab}</span>
            {activeTab === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {pendingOrdersCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="mobile-menu"
          >
            {/* Menu Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 h-auto"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {navItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleTabChange(item.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative min-h-[44px] touch-manipulation',
                    activeTab === item.name
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-muted/50',
                    item.name === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && 'animate-pulse'
                  )}
                  data-testid={`mobile-nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">
                    {isCurrentUserCustomer && item.name === 'Đơn hàng' ? 'Đơn hàng của tôi' : item.name}
                  </span>
                  {item.name === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Menu Footer */}
            <div className="p-4 border-t border-border">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 min-h-[44px]"
                    data-testid="mobile-options-button"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Tùy chọn</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 mb-2"
                >
                  {currentUser && (
                    <DropdownMenuItem 
                      onClick={() => {
                        setIsUserInfoDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>{currentUser.displayName || "Tài khoản"}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsSettingsDialogOpen(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-destructive focus:bg-destructive/20 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile (Alternative approach) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border print:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.slice(0, 5).map(item => ( // Show only first 5 items in bottom nav
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative min-h-[44px] touch-manipulation flex-1',
                activeTab === item.name
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              data-testid={`bottom-nav-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="text-xs font-medium truncate max-w-full">
                {item.name === 'Bán hàng' ? 'Bán' :
                 item.name === 'Gian hàng' ? 'Shop' :
                 item.name === 'Kho hàng' ? 'Kho' :
                 item.name === 'Đơn hàng' ? 'Đơn' :
                 item.name === 'Phân tích' ? 'Báo cáo' :
                 item.name}
              </span>
              {item.name === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                </span>
              )}
            </button>
          ))}
          
          {/* More button for additional items */}
          {navItems.length > 5 && (
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 min-h-[44px] touch-manipulation flex-1"
              data-testid="bottom-nav-more"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">Thêm</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
});

MobileNavigation.displayName = 'MobileNavigation';
