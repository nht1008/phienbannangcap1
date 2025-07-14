"use client";

import React from 'react';
import Image from 'next/image';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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

  return (
    <Sidebar collapsible="icon" className="print:hidden shadow-lg" side="left">
      <SidebarHeader className="h-52 flex items-center justify-center shadow-md bg-primary/5 border-b border-primary/20 group-data-[state=expanded]:px-4 group-data-[state=collapsed]:px-0">
        {shopInfo && shopInfo.logoUrl ? (
          <Image
            src={shopInfo.logoUrl}
            alt={shopInfo.name || "Shop Logo"}
            width={192}
            height={192}
            className="object-contain rounded-sm"
            data-ai-hint="brand logo"
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
                onClick={() => setActiveTab(item.name)}
                isActive={activeTab === item.name}
                tooltip={{ children: item.name, side: "right", align: "center" }}
                className={cn(
                  'relative rounded-lg group transition-all duration-200',
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
      <SidebarFooter className="p-2 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              tooltip={{ children: "Tùy chọn khác", side: "right", align: "center" }}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>Tùy chọn</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56 mb-2 ml-2 bg-popover text-popover-foreground"
          >
            {currentUser && (
              <DropdownMenuItem onClick={() => setIsUserInfoDialogOpen(true)}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>{currentUser.displayName || "Tài khoản"}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/20 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

MainSidebar.displayName = 'MainSidebar';
