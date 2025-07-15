"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserCircle, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopInfo } from '@/types';
import type { User } from 'firebase/auth';

type TabName = 'Bán hàng' | 'Gian hàng' | 'Kho hàng' | 'Đơn hàng' | 'Lịch sử đặt hàng' | 'Bảng xếp hạng' | 'Hóa đơn' | 'Công nợ' | 'Khách hàng' | 'Nhân viên' | 'Phân tích' | 'Đổi điểm';

interface NavItem {
  name: TabName;
  icon: React.ReactNode;
}

interface MainSidebarProps {
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

export const MainSidebar = React.memo(({
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
}: MainSidebarProps) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const { setOpenMobile } = useSidebar();

  const handleTabClick = (tabName: TabName) => {
    setActiveTab(tabName);
    // Auto-collapse sidebar after selecting a tab
    setOpenMobile(false);
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="print:hidden shadow-lg" 
      side="left"
      data-testid="main-sidebar"
    >
      <SidebarHeader className="h-32 md:h-52 flex items-center justify-center shadow-md bg-primary/5 border-b border-primary/20 group-data-[state=expanded]:px-4 group-data-[state=collapsed]:px-0">
        {shopInfo && shopInfo.logoUrl ? (
          <Image
            src={shopInfo.logoUrl}
            alt={shopInfo.name || "Shop Logo"}
            width={192}
            height={192}
            className="object-contain rounded-sm w-24 h-24 md:w-48 md:h-48"
            data-ai-hint="brand logo"
            data-testid="shop-logo"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/192x192.png';
            }}
          />
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                onClick={() => handleTabClick(item.name)}
                isActive={activeTab === item.name}
                tooltip={{ children: item.name, side: "right", align: "center" }}
                data-testid={`nav-item-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                className={cn(
                  'relative rounded-lg group transition-all duration-200 min-h-[44px] touch-manipulation',
                  activeTab === item.name
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-sidebar-foreground hover:bg-primary/25 hover:text-primary-foreground hover:scale-105',
                  item.name === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && 'animate-pulse-bg'
                )}
              >
                <span className="w-6 h-6 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">{isCurrentUserCustomer && item.name === 'Đơn hàng' ? 'Đơn hàng của tôi' : item.name}</span>
                {item.name === 'Đơn hàng' && pendingOrdersCount > 0 && !isCurrentUserCustomer && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {pendingOrdersCount}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar relative">
        {/* Custom Options Menu for better mobile compatibility */}
        <div className="relative">
          <button
            onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-[48px] transition-all duration-200 active:bg-sidebar-accent/80"
            data-testid="sidebar-options-button"
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              touchAction: 'manipulation'
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Tùy chọn</span>
          </button>
          
          {/* Custom dropdown menu */}
          {isOptionsMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsOptionsMenuOpen(false)}
                style={{ touchAction: 'manipulation' }}
              />
              
              {/* Menu content */}
              <div 
                className="absolute bottom-full left-2 mb-2 w-56 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50"
                style={{
                  touchAction: 'manipulation',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {currentUser && (
                  <button
                    onClick={() => {
                      setIsUserInfoDialogOpen(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-accent hover:text-accent-foreground min-h-[44px] first:rounded-t-lg"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>{currentUser.displayName || "Tài khoản"}</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setIsSettingsDialogOpen(true);
                    setIsOptionsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-accent hover:text-accent-foreground min-h-[44px]"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  <Settings className="h-4 w-4" />
                  <span>Cài đặt</span>
                </button>
                
                <div className="border-t border-border my-1" />
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOptionsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 text-left text-destructive hover:bg-destructive/20 hover:text-destructive min-h-[44px] last:rounded-b-lg"
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                    touchAction: 'manipulation'
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
});

MainSidebar.displayName = 'MainSidebar';
