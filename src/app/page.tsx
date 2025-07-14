"use client";

import React, { useState, useMemo, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Product, Invoice, Debt, DebtStatus, CartItem, ProductOptionType, Customer, Employee, ShopInfo, EmployeePosition, DisposalLogEntry, UserAccessRequest, UserAccessRequestStatus, ProductFormData, Order, OrderStatus, OrderItem, ProductSalesSummary, IdentifiedSlowMovingProduct, ProductSalesDetail } from '@/types';
import { initialProductFormData as defaultProductFormData } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthContextType } from '@/contexts/AuthContext';
import type { User } from 'firebase/auth';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { startOfDay, endOfDay, subDays, differenceInDays, parseISO } from 'date-fns';
import { reorderBatchNumbers } from '@/lib/batch-management';

import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { SellIcon } from '@/components/icons/SellIcon';
import { ImportIcon } from '@/components/icons/ImportIcon';
import { InvoiceIcon as InvoiceIconSvg } from '@/components/icons/InvoiceIcon';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { RevenueIcon } from '@/components/icons/RevenueIcon';
import { CustomerIcon } from '@/components/icons/CustomerIcon';
import { EmployeeIcon } from '@/components/icons/EmployeeIcon';
import { PointsIcon } from '@/components/icons/PointsIcon';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { PaymentDialog } from '@/components/debt/PaymentDialog';


import type { SalesTabHandles } from '@/components/tabs/SalesTab';
import { HeroBanner } from '@/components/storefront/HeroBanner';

const TabLoading = () => <div className="flex items-center justify-center h-64"><p>Đang tải...</p></div>;

const SalesTab = dynamic(() => import('@/components/tabs/SalesTab').then(mod => mod.SalesTab), { ssr: false, loading: TabLoading });
const WarehouseTab = dynamic(() => import('@/components/tabs/WarehouseTab').then(mod => mod.WarehouseTab), { ssr: false, loading: TabLoading });
const InvoiceTab = dynamic(() => import('@/components/tabs/InvoiceTab').then(mod => mod.InvoiceTab), { ssr: false, loading: TabLoading });
const DebtTab = dynamic(() => import('@/components/tabs/DebtTab').then(mod => mod.DebtTab), { ssr: false, loading: TabLoading });
const CustomerTab = dynamic(() => import('@/components/tabs/CustomerTab').then(mod => mod.CustomerTab), { ssr: false, loading: TabLoading });
const EmployeeTab = dynamic(() => import('@/components/tabs/EmployeeTab').then(mod => mod.EmployeeTab), { ssr: false, loading: TabLoading });
const OrdersTab = dynamic(() => import('@/components/tabs/OrdersTab').then(mod => mod.OrdersTab), { ssr: false, loading: TabLoading });
const StorefrontTab = dynamic(() => import('@/components/tabs/StorefrontTab'), { ssr: false, loading: TabLoading });
const AnalysisTab = dynamic(() => import('@/components/tabs/AnalysisTab'), { ssr: false, loading: TabLoading });
const OrderHistoryTab = dynamic(() => import('@/components/tabs/OrderHistoryTab').then(mod => mod.OrderHistoryTab), { ssr: false, loading: TabLoading });
const LeaderboardTab = dynamic(() => import('@/components/tabs/LeaderboardTab').then(mod => mod.LeaderboardTab), { ssr: false, loading: TabLoading });
const PointsTab = dynamic(() => import('@/components/tabs/PointsTab').then(mod => mod.PointsTab), { ssr: false, loading: TabLoading });
// import { HistoryTab } from '../../../../src/components/tabs/HistoryTab';
import { SetNameDialog } from '@/components/auth/SetNameDialog';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { MainSidebar } from '@/components/layout/MainSidebar';
import { LockScreen } from '@/components/shared/LockScreen';
import { SettingsDialog, type OverallFontSize, type NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { ProductDialogs } from '@/components/products/ProductDialogs';
import { DebtDialogs } from '@/components/debt/DebtDialogs';
import { CustomerDebtHistoryDialog } from '@/components/debt/CustomerDebtHistoryDialog';
import { CustomerCartSheet } from '@/components/orders/CustomerCartSheet';
import { EmployeeCartSheet } from '@/components/orders/EmployeeCartSheet';
// import { ProductOrderDialog } from '../../../../src/components/orders/ProductOrderDialog';
import { cn, normalizeStringForSearch } from '@/lib/utils';
import { calculatePoints } from '@/lib/points';
import { logDebtCreation, logDebtPayment } from '@/lib/debt-history';
import { UserX, HelpCircle, Trophy, History, BarChartBig, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';


import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar
} from '@/components/ui/sidebar';
import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut, UserCircle, Settings, Lock, ShoppingCart, Store, Pencil, Trash2, PlusCircle, MoreHorizontal } from 'lucide-react';
import { TopSpenderMarquee } from '@/components/shared/TopSpenderMarquee';
import { db, auth } from '@/lib/firebase';
import { ref, onValue, set, push, update, get, child, remove, query, orderByChild, equalTo } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "nthe1008@gmail.com";
const ADMIN_NAME = "Quản trị viên";


interface InvoiceCartItem {
  id: string;
  name: string;
  quality?: string;
  quantityInCart: number;
  price: number;
  costPrice?: number;
  images: string[];
  color: string;
  size: string;
  unit: string;
  itemDiscount?: number;
}


type TabName = 'Bán hàng' | 'Gian hàng' | 'Kho hàng' | 'Đơn hàng' | 'Lịch sử đặt hàng' | 'Bảng xếp hạng' | 'Hóa đơn' | 'Công nợ' | 'Khách hàng' | 'Nhân viên' | 'Phân tích' | 'Đổi điểm';

export interface ActivityDateTimeFilter {
  startDate: Date | null;
  endDate: Date | null;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

export interface CustomerInsight {
  topCustomersByRevenue: {
    customerId: string;
    name: string;
    totalRevenue: number;
    invoiceCount: number;
  }[];
  topCustomersByInvoiceCount: {
    customerId: string;
    name: string;
    invoiceCount: number;
    lastPurchaseDate: string;
  }[];
  newVsReturning: {
    new: number;
    returning: number;
  };
}

export interface SalesByHour {
    hour: string;
    sales: number;
    revenue: number;
}

const getInitialActivityDateTimeFilter = (
  setStartOfDayToday: boolean = true,
  setEndOfDayToday: boolean = true
): ActivityDateTimeFilter => {
  const now = new Date();
  return {
    startDate: setStartOfDayToday ? startOfDay(now) : null,
    endDate: setEndOfDayToday ? endOfDay(now) : null,
    startHour: '00',
    startMinute: '00',
    endHour: '23',
    endMinute: '59',
  };
};

const getCombinedDateTime = (dateInput: Date | null, hourStr: string, minuteStr: string): Date | null => {
    if (!dateInput) return null;
    const newDate = new Date(dateInput);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const isEndMinute = minuteStr === '59';
      const seconds = isEndMinute ? 59 : 0;
      const milliseconds = isEndMinute ? 999 : 0;
      newDate.setHours(hours, minutes, seconds, milliseconds);
    }
    return newDate;
};

const filterActivityByDateTimeRange = <T extends { date: string }>(
  data: T[],
  filter: ActivityDateTimeFilter
): T[] => {
  if (!data) return [];
  const { startDate, endDate, startHour, startMinute, endHour, endMinute } = filter;

  if (!startDate && !endDate) {
    return data;
  }

  let effectiveStartDate: Date | null = null;
  if (startDate) {
    effectiveStartDate = getCombinedDateTime(startDate, startHour, startMinute);
  }

  let effectiveEndDate: Date | null = null;
  if (endDate) {
    effectiveEndDate = getCombinedDateTime(endDate, endHour, endMinute);
    if (effectiveEndDate && endMinute === '59' && endHour === '23') {
        effectiveEndDate = endOfDay(effectiveEndDate);
    } else if (effectiveEndDate && endMinute === '59') {
        effectiveEndDate.setSeconds(59, 999);
    }
  }

  return data.filter(item => {
    const itemDateTime = new Date(item.date);
    const afterStartDate = !effectiveStartDate || itemDateTime >= effectiveStartDate;
    const beforeEndDate = !effectiveEndDate || itemDateTime <= effectiveEndDate;
    return afterStartDate && beforeEndDate;
  });
};


interface FleurManagerLayoutContentProps {
  currentUser: User;
  activeTab: TabName;
  setActiveTab: React.Dispatch<React.SetStateAction<TabName>>;
  inventory: Product[];
  customersData: Customer[];
  enhancedCustomersData: Customer[];
  ordersData: Order[];
  invoicesData: Invoice[];
  debtsData: Debt[];
  employeesData: Employee[];
  disposalLogEntries: DisposalLogEntry[];
  productSalesSummaryData?: ProductSalesSummary;
  identifiedSlowMovingProductsData?: IdentifiedSlowMovingProduct[];
  customerInsightsData: CustomerInsight;
  salesByHourData: SalesByHour[];
  shopInfo: ShopInfo | null;
  isLoadingShopInfo: boolean;
  authLoading: boolean;
  isLoadingAccessRequest: boolean;
  cart: CartItem[];
  customerCart: CartItem[];
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  storefrontProducts: Product[];
  storefrontProductIds: Record<string, boolean>;
  invoiceFilter: ActivityDateTimeFilter;
  orderFilter: ActivityDateTimeFilter;
  analysisFilter: ActivityDateTimeFilter;
  isUserInfoDialogOpen: boolean;
  setIsUserInfoDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isScreenLocked: boolean;
  setIsScreenLocked: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsDialogOpen: boolean;
  setIsSettingsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  overallFontSize: OverallFontSize;
  setOverallFontSize: React.Dispatch<React.SetStateAction<OverallFontSize>>;
  numericDisplaySize: NumericDisplaySize;
  setNumericDisplaySize: React.Dispatch<React.SetStateAction<NumericDisplaySize>>;
  isCurrentUserAdmin: boolean;
  currentUserEmployeeData: Employee | null;
  isCurrentUserCustomer: boolean;
  hasFullAccessRights: boolean;
  filteredInvoicesForInvoiceTab: Invoice[];
  filteredDebtsForDebtTab: Debt[];
  filteredOrdersForOrderTab: Order[];
  filteredInvoicesForAnalysis: Invoice[];
  filteredDisposalLogForAnalysis: DisposalLogEntry[];
  handleCreateInvoice: (customerName: string, invoiceCartItems: CartItem[], subtotalAfterItemDiscounts: number, paymentMethod: string, amountPaid: number, isGuestCustomer: boolean, employeeId: string, employeeName: string, tierDiscount: number) => Promise<boolean>;
  handleAddProductOption: (type: ProductOptionType, name: string) => Promise<void>;
  handleDeleteProductOption: (type: ProductOptionType, name: string) => Promise<void>;
  handleImportProducts: (
    supplierName: string | undefined, 
    itemsToSubmit: {
      productId: string;
      quantity: number;
      costPriceVND: number;
      salePriceVND: number; // Thêm giá bán
      batchNumber: number; // Thêm batch number tự động
      priceAction?: 'keep' | 'update';
    }[], 
    totalCostVND: number, 
    employeeId: string, 
    employeeName: string
  ) => Promise<boolean>;
  handleProcessInvoiceCancellationOrReturn: (invoiceId: string, operationType: "delete" | "return", itemsToReturnArray?: { productId: string; name: string; quantityToReturn: number; }[] | undefined) => Promise<boolean>;
  handleAddPayment: (debtId: string, amount: number, notes: string, employeeId: string, employeeName: string) => Promise<void>;
  openPaymentDialog: (debt: Debt) => void;
  openCustomerDebtHistoryDialog: (customerId: string, customerName: string) => void;
  handleAddCustomer: (newCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => Promise<void>;
  handleUpdateCustomer: (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => Promise<void>;
  handleDeleteCustomer: (customerId: string) => Promise<void>;
  handleDeleteDebt: (debtId: string) => void;
  handleSaveShopInfo: (newInfo: ShopInfo) => Promise<void>;
  handleSignOut: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<User | null>;
  onAddToCart: (item: Product) => void;
  onUpdateCartQuantity: (itemId: string, newQuantityStr: string) => void;
  onItemDiscountChange: (itemId: string, discountNghinStr: string) => boolean;
  onClearCart: () => void;
  onRemoveFromCart: (itemId: string) => void;
  onAddToCartForCustomer: (product: Product, quantity: number, notes: string) => void;
  handleInvoiceFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleOrderFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleAnalysisFilterChange: (newFilter: ActivityDateTimeFilter) => void;
  handleUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, currentEmployeeId: string, currentEmployeeName: string) => Promise<void>;
  handleToggleEmployeeRole: (employeeId: string, currentPosition: EmployeePosition) => Promise<void>;
  handleUpdateEmployeeInfo: (employeeId: string, data: { name: string; phone?: string; zaloName?: string; }) => Promise<void>;
  handleDeleteEmployee: (employeeId: string) => Promise<void>;
  handleDisposeProductItems: (
    productId: string,
    quantityToDecrease: number,
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'images'>,
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  openAddProductDialog: () => void;
  openEditProductDialog: (product: Product) => void;
  handleDeleteProductFromAnywhere: (productId: string) => Promise<void>;
  handleUpdateProduct: (updatedProduct: Product) => Promise<void>;
  handleAddToStorefront: (productId: string) => Promise<void>;
  handleRemoveFromStorefront: (productId: string) => Promise<void>;
  handleDeleteDisposalEntry: (id: string) => Promise<void>;
  setIsCartSheetOpen: (isOpen: boolean) => void;
  onOpenNoteEditor: (itemId: string) => void;
  onSelectProductGroupForOrder: (productGroup: Product[]) => void;
  handleAddToCartFromStorefront: (product: Product) => void;
  onConfirmCancel: (order: Order, reason: string) => void;
  isCartAnimating: boolean;
  salesTabRef: React.RefObject<SalesTabHandles>;
  handleSaveProductDescription: (productId: string, description: string) => Promise<void>;
}

const FleurManagerLayoutContent = React.memo((props: FleurManagerLayoutContentProps) => {
  const {
    currentUser, activeTab, setActiveTab, inventory, customersData, enhancedCustomersData, ordersData, invoicesData, debtsData, employeesData, disposalLogEntries, productSalesSummaryData, identifiedSlowMovingProductsData, customerInsightsData, salesByHourData,
    shopInfo, isLoadingShopInfo, authLoading, isLoadingAccessRequest, cart, customerCart, productNameOptions, colorOptions, productQualityOptions, sizeOptions,
    unitOptions, storefrontProducts, storefrontProductIds, invoiceFilter, orderFilter, analysisFilter, isUserInfoDialogOpen, setIsUserInfoDialogOpen,
    isScreenLocked, setIsScreenLocked, isSettingsDialogOpen, setIsSettingsDialogOpen, overallFontSize,
    setOverallFontSize, numericDisplaySize, setNumericDisplaySize, isCurrentUserAdmin, currentUserEmployeeData, isCurrentUserCustomer, hasFullAccessRights,
    filteredInvoicesForInvoiceTab, filteredDebtsForDebtTab, filteredOrdersForOrderTab, filteredInvoicesForAnalysis, filteredDisposalLogForAnalysis,
    handleCreateInvoice, handleAddProductOption,
    handleDeleteProductOption, handleImportProducts, handleProcessInvoiceCancellationOrReturn,
    handleAddPayment, openPaymentDialog, openCustomerDebtHistoryDialog, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, handleDeleteDebt,
    handleSaveShopInfo, handleSignOut, signIn, onAddToCart, onUpdateCartQuantity, onItemDiscountChange, onClearCart, onRemoveFromCart, onAddToCartForCustomer,
    handleInvoiceFilterChange, handleOrderFilterChange, handleAnalysisFilterChange, handleUpdateOrderStatus,
    handleToggleEmployeeRole, handleUpdateEmployeeInfo, handleDeleteEmployee, handleDisposeProductItems,
    openAddProductDialog, openEditProductDialog, handleDeleteProductFromAnywhere, handleUpdateProduct,
    handleAddToStorefront, handleRemoveFromStorefront, handleDeleteDisposalEntry, onOpenNoteEditor, setIsCartSheetOpen,
    onSelectProductGroupForOrder,
    handleAddToCartFromStorefront,
    onConfirmCancel,
    isCartAnimating,
    salesTabRef,
    handleSaveProductDescription
  } = props;

  const { open: sidebarStateOpen, toggleSidebar, isMobile } = useSidebar();

  const pendingOrdersCount = useMemo(() => {
    if (isCurrentUserCustomer) return 0; // Customers don't need to see this badge.
    return ordersData.filter(o => o.orderStatus === 'Chờ xác nhận' || o.orderStatus === 'Yêu cầu hủy').length;
  }, [ordersData, isCurrentUserCustomer]);

  const baseNavItems = useMemo(() => [
    { name: 'Bán hàng' as TabName, icon: <SellIcon /> },
    { name: 'Gian hàng' as TabName, icon: <Store /> },
    { name: 'Kho hàng' as TabName, icon: <WarehouseIcon /> },
    { name: 'Đơn hàng' as TabName, icon: <ShoppingCart /> },
    { name: 'Lịch sử đặt hàng' as TabName, icon: <History /> },
    { name: 'Bảng xếp hạng' as TabName, icon: <Trophy /> },
    { name: 'Đổi điểm' as TabName, icon: <PointsIcon /> },
    { name: 'Hóa đơn' as TabName, icon: <InvoiceIconSvg /> },
    { name: 'Công nợ' as TabName, icon: <DebtIcon /> },
    { name: 'Phân tích' as TabName, icon: <BarChartBig /> },
    { name: 'Khách hàng' as TabName, icon: <CustomerIcon /> },
    { name: 'Nhân viên' as TabName, icon: <EmployeeIcon /> },
  ], []);

  const navItems = useMemo(() => {
    if (isCurrentUserCustomer) {
      return baseNavItems.filter(item =>
        item.name === 'Gian hàng' ||
        item.name === 'Đơn hàng' ||
        item.name === 'Lịch sử đặt hàng' ||
        item.name === 'Bảng xếp hạng'
      );
    }

    // Whitelist for Managers/Admins
    const managerTabs: TabName[] = ['Bán hàng', 'Gian hàng', 'Kho hàng', 'Đơn hàng', 'Hóa đơn', 'Công nợ', 'Phân tích', 'Bảng xếp hạng', 'Khách hàng', 'Nhân viên'];
    if (hasFullAccessRights) {
        return baseNavItems.filter(item => managerTabs.includes(item.name));
    }
    
    // Whitelist for Staff
    const staffTabs: TabName[] = ['Bán hàng', 'Kho hàng', 'Hóa đơn', 'Công nợ', 'Khách hàng'];
    if (currentUserEmployeeData?.position === 'Nhân viên') {
        return baseNavItems.filter(item => staffTabs.includes(item.name));
    }

    // Default for any other authenticated user (should not happen in normal flow, but safe fallback)
    return [];
  }, [baseNavItems, isCurrentUserCustomer, hasFullAccessRights, currentUserEmployeeData]);

  const tabs: Record<TabName, ReactNode> = useMemo(() => ({
    'Bán hàng': <SalesTab
                     ref={salesTabRef}
                     inventory={inventory}
                     customers={enhancedCustomersData}
                     invoices={invoicesData}
                     onCreateInvoice={handleCreateInvoice}
                     currentUser={currentUser}
                     numericDisplaySize={numericDisplaySize}
                     cart={cart}
                     onAddToCart={onAddToCart}
                     onUpdateCartQuantity={onUpdateCartQuantity}
                     onItemDiscountChange={onItemDiscountChange}
                     onClearCart={onClearCart}
                     colorOptions={colorOptions}
                     productQualityOptions={productQualityOptions}
                     sizeOptions={sizeOptions}
                     unitOptions={unitOptions}
                   />,
   'Gian hàng': <StorefrontTab
                   inventory={storefrontProducts}
                   invoices={invoicesData}
                   onAddToCart={handleAddToCartFromStorefront}
                   isCustomerView={isCurrentUserCustomer}
                   hasFullAccessRights={hasFullAccessRights}
                   onRemoveFromStorefront={handleRemoveFromStorefront}
                   onSaveDescription={handleSaveProductDescription}
                   colorOptions={colorOptions}
                   productQualityOptions={productQualityOptions}
                   sizeOptions={sizeOptions}
                   unitOptions={unitOptions}
                 />,
    'Kho hàng': <WarehouseTab
                    inventory={inventory}
                    invoices={invoicesData}
                    onOpenAddProductDialog={openAddProductDialog}
                    onOpenEditProductDialog={openEditProductDialog}
                    onDeleteProduct={handleDeleteProductFromAnywhere}
                    productNameOptions={productNameOptions}
                    colorOptions={colorOptions}
                    productQualityOptions={productQualityOptions}
                    sizeOptions={sizeOptions}
                    unitOptions={unitOptions}
                    onAddOption={handleAddProductOption}
                    onDeleteOption={handleDeleteProductOption}
                    hasFullAccessRights={hasFullAccessRights}
                    onDisposeProductItems={handleDisposeProductItems}
                    currentUser={currentUser}
                    storefrontProductIds={storefrontProductIds}
                    onAddToStorefront={handleAddToStorefront}
                    onRemoveFromStorefront={handleRemoveFromStorefront}
                    onUpdateProduct={handleUpdateProduct}
                    onImportProducts={handleImportProducts}
                  />,
    'Đơn hàng': <OrdersTab
                  orders={filteredOrdersForOrderTab}
                  onUpdateStatus={handleUpdateOrderStatus}
                  currentUser={currentUser}
                  hasFullAccessRights={hasFullAccessRights}
                  onConfirmCancel={onConfirmCancel}
                />,
    'Lịch sử đặt hàng': <OrderHistoryTab
                          invoices={invoicesData}
                          currentUser={currentUser}
                        />,
    'Hóa đơn': <InvoiceTab
                  invoices={filteredInvoicesForInvoiceTab || []}
                  onProcessInvoiceCancellationOrReturn={handleProcessInvoiceCancellationOrReturn}
                  filter={invoiceFilter}
                  onFilterChange={handleInvoiceFilterChange}
                  hasFullAccessRights={hasFullAccessRights}
                />,
    'Công nợ': <DebtTab
                  debts={filteredDebtsForDebtTab}
                  onOpenPaymentDialog={openPaymentDialog}
                  openCustomerDebtHistoryDialog={openCustomerDebtHistoryDialog}
                  currentUser={currentUser}
                />,
    'Khách hàng': <CustomerTab
                      customers={enhancedCustomersData}
                      invoices={invoicesData}
                      onAddCustomer={handleAddCustomer}
                      onUpdateCustomer={handleUpdateCustomer}
                      onDeleteCustomer={handleDeleteCustomer}
                      hasFullAccessRights={hasFullAccessRights}
                      currentUser={currentUser}
                      isCurrentUserAdmin={isCurrentUserAdmin}
                    />,
    'Nhân viên': <EmployeeTab
                    employees={employeesData}
                    currentUser={currentUser}
                    invoices={invoicesData}
                    debts={debtsData}
                    numericDisplaySize={numericDisplaySize}
                    onDeleteDebt={handleDeleteDebt}
                    onToggleEmployeeRole={handleToggleEmployeeRole}
                    onUpdateEmployeeInfo={handleUpdateEmployeeInfo}
                    adminEmail={ADMIN_EMAIL}
                    onDeleteEmployee={handleDeleteEmployee}
                  />,
    'Phân tích': <div className="space-y-6">
                  <AnalysisTab
                    invoices={filteredInvoicesForAnalysis}
                    inventory={inventory}
                    customerInsights={customerInsightsData}
                    filter={analysisFilter}
                    onFilterChange={handleAnalysisFilterChange}
                    isLoading={isLoadingAccessRequest || authLoading}
                  />
                </div>,
    'Bảng xếp hạng': <LeaderboardTab customers={enhancedCustomersData} invoices={invoicesData} debts={debtsData} />,
    'Đổi điểm': <PointsTab customers={enhancedCustomersData} />,
  }), [
      inventory, customersData, enhancedCustomersData, ordersData, invoicesData, debtsData, employeesData, disposalLogEntries, productSalesSummaryData, identifiedSlowMovingProductsData, customerInsightsData, salesByHourData, cart, currentUser, numericDisplaySize,
      productNameOptions, colorOptions, productQualityOptions, sizeOptions, unitOptions,
      storefrontProducts, storefrontProductIds,
      filteredInvoicesForInvoiceTab, invoiceFilter,
      filteredDebtsForDebtTab, filteredOrdersForOrderTab, orderFilter, analysisFilter,
      filteredInvoicesForAnalysis, filteredDisposalLogForAnalysis,
      hasFullAccessRights, isCurrentUserCustomer,
      handleCreateInvoice, handleAddProductOption, handleDeleteProductOption, handleImportProducts,
      handleProcessInvoiceCancellationOrReturn, handleAddPayment, openPaymentDialog, openCustomerDebtHistoryDialog,
      handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, handleDeleteDebt,
      onAddToCart, onUpdateCartQuantity, onItemDiscountChange, onClearCart, onRemoveFromCart, onAddToCartForCustomer,
      handleInvoiceFilterChange, handleOrderFilterChange, handleAnalysisFilterChange, handleUpdateOrderStatus,
      handleToggleEmployeeRole, handleUpdateEmployeeInfo, handleDeleteEmployee, handleDisposeProductItems,
      openAddProductDialog, openEditProductDialog, handleDeleteProductFromAnywhere, handleUpdateProduct,
      handleAddToStorefront, handleRemoveFromStorefront, handleDeleteDisposalEntry, onSelectProductGroupForOrder, handleAddToCartFromStorefront, onConfirmCancel, salesTabRef, handleSaveProductDescription
  ]);

  return (
      <div className="flex h-screen bg-background font-body">
        <MainSidebar
          shopInfo={shopInfo}
          navItems={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingOrdersCount={pendingOrdersCount}
          isCurrentUserCustomer={isCurrentUserCustomer}
          currentUser={currentUser}
          setIsUserInfoDialogOpen={setIsUserInfoDialogOpen}
          setIsSettingsDialogOpen={setIsSettingsDialogOpen}
          handleSignOut={handleSignOut}
        />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <TopSpenderMarquee customers={customersData} invoices={invoicesData} debts={debtsData} />
            <main className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex items-center mb-4 print:hidden px-4 pt-4 lg:px-6 lg:pt-6">
                <SidebarTrigger className="md:hidden mr-4">
                  <PanelLeft />
                </SidebarTrigger>
                <h2 className="text-3xl font-bold text-foreground font-headline">{isCurrentUserCustomer && activeTab === 'Đơn hàng' ? 'Đơn hàng của tôi' : activeTab}</h2>
              </div>
              <div className="min-h-[calc(100vh-8rem)]">
                {activeTab === 'Gian hàng' && (
                  <div className="mb-6 -mt-4">
                    <HeroBanner hasFullAccessRights={hasFullAccessRights} />
                  </div>
                )}
                <div key={activeTab} className="animate-fadeInUp px-4 pb-4 lg:px-6 lg:pb-6">
                  {tabs[activeTab]}
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>

      {currentUser && (
        <Dialog open={isUserInfoDialogOpen} onOpenChange={setIsUserInfoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thông tin tài khoản</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về tài khoản của bạn.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="info-displayName" className="text-right">
                  Tên hiển thị
                </Label>
                <Input id="info-displayName" value={currentUser.displayName || 'Chưa cập nhật'} readOnly className="col-span-3 bg-muted/50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="info-email" className="text-right">
                  Email
                </Label>
                <Input id="info-email" value={currentUser.email || 'Không có'} readOnly className="col-span-3 bg-muted/50" />
              </div>
              {currentUserEmployeeData && (
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="info-position" className="text-right">
                          Chức vụ
                      </Label>
                      <Input id="info-position" value={currentUserEmployeeData.position} readOnly className="col-span-3 bg-muted/50" />
                  </div>
              )}
               {isCurrentUserCustomer && (
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="info-role" className="text-right">
                          Vai trò
                      </Label>
                      <Input id="info-role" value="Khách hàng" readOnly className="col-span-3 bg-muted/50" />
                  </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsUserInfoDialogOpen(false)} variant="outline">Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        overallFontSize={overallFontSize}
        onOverallFontSizeChange={setOverallFontSize}
        numericDisplaySize={numericDisplaySize}
        onNumericDisplaySizeChange={setNumericDisplaySize}
        shopInfo={shopInfo}
        onSaveShopInfo={handleSaveShopInfo}
        hasAdminOrManagerRights={hasFullAccessRights}
        isLoadingShopInfo={isLoadingShopInfo}
      />

      {!isMobile && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleSidebar}
                className="fixed top-6 right-6 z-50 h-12 w-12 rounded-full bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary/90 backdrop-blur-sm active:bg-primary/70 transition-all duration-150 ease-in-out hover:scale-105 print:hidden"
                size="icon"
                aria-label={sidebarStateOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
              >
                {sidebarStateOpen ? <ChevronsLeft className="h-6 w-6" /> : <ChevronsRight className="h-6 w-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-card text-card-foreground">
              <p>{sidebarStateOpen ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {isCurrentUserCustomer ? (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsCartSheetOpen(true)}
                        className={cn(
                            "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:bg-primary/80 transition-transform duration-150 ease-in-out hover:scale-105 print:hidden",
                            customerCart.length > 0 && "animate-flash-and-grow"
                        )}
                        size="icon"
                        aria-label="Xem giỏ hàng"
                    >
                        <ShoppingCart className="h-7 w-7" />
                        {customerCart.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {customerCart.reduce((acc, item) => acc + item.quantityInCart, 0)}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card text-card-foreground">
                    <p>Xem giỏ hàng</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      ) : (
        <>
          <TooltipProvider delayDuration={0}>
              <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                  onClick={() => setIsScreenLocked(true)}
                  className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 active:bg-primary/80 transition-transform duration-150 ease-in-out hover:scale-105 print:hidden"
                  size="icon"
                  aria-label="Khóa màn hình"
                  >
                  <Lock className="h-7 w-7" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-card text-card-foreground">
                  <p>Khóa màn hình</p>
              </TooltipContent>
              </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsCartSheetOpen(true)}
                        className={cn(
                            "fixed top-1/2 -translate-y-1/2 right-6 z-50 h-12 w-12 rounded-full bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary/90 backdrop-blur-sm active:bg-primary/70 transition-all duration-150 ease-in-out hover:scale-105 print:hidden",
                            cart.length > 0 && "animate-flash-and-grow"
                        )}
                        size="icon"
                        aria-label="Xem giỏ hàng"
                    >
                        <ShoppingCartIcon className="h-6 w-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {cart.reduce((acc, item) => acc + item.quantityInCart, 0)}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-card text-card-foreground">
                    <p>Xem giỏ hàng</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        </>
      )}

      <LockScreen
        isOpen={isScreenLocked}
        onUnlock={() => setIsScreenLocked(false)}
        currentUserEmail={currentUser?.email || null}
        signIn={signIn}
        currentUserName={currentUser?.displayName}
      />
      </div>
  );
});
FleurManagerLayoutContent.displayName = 'FleurManagerLayoutContent';


export default function FleurManagerPage() {
  const { currentUser, loading: authLoading, signOut, updateUserProfileName, signIn } = useAuth() as AuthContextType;
  const router = useRouter();
  const { toast } = useToast();
  const salesTabRef = useRef<SalesTabHandles>(null);

  const [isSettingName, setIsSettingName] = useState(false);
  const [userAccessRequest, setUserAccessRequest] = useState<UserAccessRequest | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('Bán hàng');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [enhancedCustomersData, setEnhancedCustomersData] = useState<Customer[]>([]);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [debtsData, setDebtsData] = useState<Debt[]>([]);
  const [employeesData, setEmployeesData] = useState<Employee[]>([]);
  const [disposalLogEntries, setDisposalLogEntries] = useState<DisposalLogEntry[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [productQualityOptions, setProductQualityOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [storefrontProductIds, setStorefrontProductIds] = useState<Record<string, boolean>>({});

  const [invoiceFilter, setInvoiceFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());
  const [orderFilter, setOrderFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());
  const [analysisFilter, setAnalysisFilter] = useState<ActivityDateTimeFilter>(getInitialActivityDateTimeFilter());


  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [overallFontSize, setOverallFontSize] = useState<OverallFontSize>('md');
  const [numericDisplaySize, setNumericDisplaySize] = useState<NumericDisplaySize>('text-2xl');
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);
  const [isCartAnimating, setIsCartAnimating] = useState(false); // This state is no longer used for the continuous animation but might be used elsewhere. Let's remove the logic tied to it for now.

  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [isConfirmingDebtDelete, setIsConfirmingDebtDelete] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCustomerDebtHistoryDialogOpen, setIsCustomerDebtHistoryDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<{ id: string; name: string } | null>(null);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [currentEditingProduct, setCurrentEditingProduct] = useState<Product | null>(null);
  const [isProductFormEditMode, setIsProductFormEditMode] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isConfirmingProductDelete, setIsConfirmingProductDelete] = useState(false);

  const [isCurrentUserCustomer, setIsCurrentUserCustomer] = useState(false);
  const [currentUserCustomerData, setCurrentUserCustomerData] = useState<Customer | null>(null);
  const [isLoadingAccessRequest, setIsLoadingAccessRequest] = useState(true);

  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteContent, setItemNoteContent] = useState('');

  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProductGroupForOrder, setSelectedProductGroupForOrder] = useState<Product[] | null>(null);

  const isCurrentUserAdmin = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser]);
  const [currentUserEmployeeData, setCurrentUserEmployeeData] = useState<Employee | null>(null);

  useEffect(() => {
    if (customersData.length > 0 && invoicesData.length > 0) {
      const spendingMap = new Map<string, number>();
      
      // Tính chi tiêu từ hóa đơn (chỉ phần đã thanh toán)
      invoicesData.forEach(invoice => {
        const normalizedName = normalizeStringForSearch(invoice.customerName);
        if (normalizedName && normalizedName.toLowerCase() !== 'khách lẻ' && normalizedName.toLowerCase() !== 'khach le') {
          const currentSpending = spendingMap.get(normalizedName) || 0;
          // Chỉ tính số tiền đã thanh toán thực tế, không tính số tiền nợ
          const paidAmount = invoice.amountPaid || 0;
          spendingMap.set(normalizedName, currentSpending + paidAmount);
        }
      });

      // Thanh toán công nợ không được tính vào tổng chi tiêu vì đó chỉ là thanh toán các khoản nợ từ hóa đơn trước đó
      // Tổng chi tiêu chỉ tính từ số tiền đã thanh toán trong hóa đơn (amountPaid)

      const enhancedData = customersData.map(customer => {
        const normalizedName = normalizeStringForSearch(customer.name);
        const totalSpent = spendingMap.get(normalizedName) || 0;
        return {
          ...customer,
          totalSpent,
          tier: getVipTier(totalSpent),
        };
      });
      setEnhancedCustomersData(enhancedData);
    } else {
      setEnhancedCustomersData(customersData);
    }
  }, [customersData, invoicesData]);

  const getVipTier = (totalSpent: number): string => {
      if (totalSpent >= 100000000) return 'Đại gia';
      if (totalSpent >= 70000000) return 'Phú ông';
      if (totalSpent >= 40000000) return 'Thương gia';
      if (totalSpent >= 20000000) return 'Chủ đồn điền';
      if (totalSpent >= 10000000) return 'Nông dân';
      if (totalSpent >= 5000000) return 'Đầy tớ';
      return 'Vô danh';
  }

  const hasFullAccessRights = useMemo(() => {
    if (isCurrentUserCustomer) return false;
    if (!currentUser) return false;
    if (currentUser.email === ADMIN_EMAIL) return true;
    if (currentUserEmployeeData) {
      return currentUserEmployeeData.position === 'Quản lý' || currentUserEmployeeData.position === 'ADMIN';
    }
    return false;
  }, [currentUser, currentUserEmployeeData, isCurrentUserCustomer]);


  const openAddProductDialog = () => {
    setCurrentEditingProduct(null);
    setIsProductFormEditMode(false);
    setIsProductFormOpen(true);
  };

  const openEditProductDialog = (product: Product) => {
    setCurrentEditingProduct(product);
    setIsProductFormEditMode(true);
    setIsProductFormOpen(true);
  };

  const handleCloseProductFormDialog = () => {
    setIsProductFormOpen(false);
    setCurrentEditingProduct(null);
  };

  const handleProductFormSubmit = useCallback(async (
    productData: Omit<Product, 'id'>,
    isEdit: boolean,
    productId?: string
  ): Promise<boolean> => {
    try {
      // Tự động thêm thuộc tính mới nếu chưa có
      const attributesToAdd: { type: ProductOptionType; value: string }[] = [];
      
      if (productData.color && !colorOptions.includes(productData.color)) {
        attributesToAdd.push({ type: 'colors', value: productData.color });
      }
      
      if (productData.quality && !productQualityOptions.includes(productData.quality)) {
        attributesToAdd.push({ type: 'qualities', value: productData.quality });
      }
      
      if (productData.size && !sizeOptions.includes(productData.size)) {
        attributesToAdd.push({ type: 'sizes', value: productData.size });
      }
      
      if (productData.unit && !unitOptions.includes(productData.unit)) {
        attributesToAdd.push({ type: 'units', value: productData.unit });
      }
      
      // Thêm các thuộc tính mới vào database
      for (const attr of attributesToAdd) {
        const sanitizedName = attr.value.trim().replace(/[.#$[\]]/g, '_');
        await set(ref(db, `productOptions/${attr.type}/${sanitizedName}`), true);
      }

      const isDuplicate = inventory.some(p =>
        (isEdit ? p.id !== productId : true) &&
        p.name === productData.name &&
        p.color === productData.color &&
        p.quality === productData.quality &&
        p.size === productData.size &&
        p.unit === productData.unit
      );

      if (isDuplicate) {
        toast({ title: "Lỗi", description: "Sản phẩm đã tồn tại với các thuộc tính y hệt.", variant: "destructive", duration: 2000 });
        return false;
      }

      if (isEdit && productId) {
        await update(ref(db, `inventory/${productId}`), productData);
        toast({ title: "Thành công", description: "Sản phẩm đã được cập nhật.", duration: 2000 });
      } else {
        const newProductRef = push(ref(db, 'inventory'));
        await set(newProductRef, productData);
        toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào kho.", duration: 2000 });
      }
      return true;

    } catch (error) {
      console.error("Error in handleProductFormSubmit:", error);
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
      toast({ title: "Lỗi lưu sản phẩm", description: errorMessage, variant: "destructive", duration: 2000 });
      return false;
    }
  }, [inventory, toast, colorOptions, productQualityOptions, sizeOptions, unitOptions]);

  const handleDeleteProductFromAnywhere = useCallback(async (productId: string): Promise<void> => {
    if (!hasFullAccessRights) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền xóa sản phẩm.", variant: "destructive", duration: 2000 });
      return;
    }
    setProductToDeleteId(productId);
    setIsConfirmingProductDelete(true);
  }, [hasFullAccessRights, toast]);

  const handleUpdateProduct = useCallback(async (updatedProduct: Product): Promise<void> => {
    try {
      await update(ref(db, `inventory/${updatedProduct.id}`), updatedProduct);
      toast({ 
        title: "Thành công", 
        description: "Sản phẩm đã được cập nhật.", 
        duration: 2000 
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ 
        title: "Lỗi", 
        description: "Không thể cập nhật sản phẩm. Vui lòng thử lại.", 
        variant: "destructive", 
        duration: 2000 
      });
    }
  }, [toast]);

  const confirmDeleteProduct = useCallback(async () => {
    if (productToDeleteId) {
      try {
        await remove(ref(db, `inventory/${productToDeleteId}`));
        toast({ title: "Thành công", description: "Sản phẩm đã được xóa.", duration: 2000 });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({ title: "Lỗi", description: "Không thể xóa sản phẩm. Vui lòng thử lại.", variant: "destructive", duration: 2000 });
      } finally {
        setIsConfirmingProductDelete(false);
        setProductToDeleteId(null);
      }
    }
  }, [productToDeleteId, toast]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fleur-manager-font-size') as OverallFontSize | null;
    if (savedFontSize && ['sm', 'md', 'lg'].includes(savedFontSize)) setOverallFontSize(savedFontSize);
    
    const savedNumericSize = localStorage.getItem('fleur-manager-numeric-size') as NumericDisplaySize | null;
    const validSizes: NumericDisplaySize[] = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
    if (savedNumericSize && validSizes.includes(savedNumericSize)) setNumericDisplaySize(savedNumericSize);
  }, []);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-overall-font-size', overallFontSize);
    localStorage.setItem('fleur-manager-font-size', overallFontSize);
  }, [overallFontSize]);

  useEffect(() => {
    localStorage.setItem('fleur-manager-numeric-size', numericDisplaySize);
  }, [numericDisplaySize]);



  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Main access control and role determination effect
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }
  
    const checkUserAccess = async () => {
      setIsLoadingAccessRequest(true);
      setIsCurrentUserCustomer(false);
      setCurrentUserEmployeeData(null);
      setUserAccessRequest(null);

      try {
        // Path 1: User is Admin (fastest check)
        if (currentUser.email === ADMIN_EMAIL) {
          if (!currentUser.displayName) setIsSettingName(true);
          
          // Patch: Ensure admin role exists in the database for the current admin user.
          // This fixes existing admin accounts that were created before the role logic was added.
          const userRoleRef = ref(db, `userRoles/${currentUser.uid}`);
          const userRoleSnap = await get(userRoleRef);
          if (!userRoleSnap.exists() || userRoleSnap.val() !== 'admin') {
            // Use update to be safe, though set should also work.
            await update(ref(db), { [`userRoles/${currentUser.uid}`]: 'admin' });
          }
          // Do not return early. Proceed to fetch the admin's employee data.
        }
    
        // Path 2: Check if user is an approved Employee (direct get)
        const employeeSnapshot = await get(ref(db, `employees/${currentUser.uid}`));
        if (employeeSnapshot.exists()) {
          setCurrentUserEmployeeData({ id: currentUser.uid, ...employeeSnapshot.val() });
          if (!currentUser.displayName) setIsSettingName(true);
          return;
        }
    
        // Path 3: Check if user is an approved Customer (direct get)
        const customerSnapshot = await get(ref(db, `customers/${currentUser.uid}`));
        if (customerSnapshot.exists()) {
          setIsCurrentUserCustomer(true);
          setCurrentUserCustomerData({ id: currentUser.uid, ...customerSnapshot.val() });
          if (!currentUser.displayName) setIsSettingName(true);
          return;
        }
    
        // Path 4: Check for a pending/rejected request (direct get)
        const requestSnapshot = await get(ref(db, `khach_hang_cho_duyet/${currentUser.uid}`));
        if (requestSnapshot.exists()) {
          setUserAccessRequest({ id: currentUser.uid, ...requestSnapshot.val() });
          if (!currentUser.displayName) setIsSettingName(true);
          return;
        }
        
        // Path 5: No access rights found
        if (!currentUser.displayName) setIsSettingName(true);

      } catch (error) {
        console.error("Error during checkUserAccess:", error);
        // This will result in the "No Access" screen, which is appropriate
        // if we can't even read the DB to check for access.
      } finally {
        setIsLoadingAccessRequest(false);
      }
    };
  
    checkUserAccess();
  
  }, [currentUser, authLoading]);
  
  // Unified Data Loading Effect
  useEffect(() => {
    if (!currentUser || isLoadingAccessRequest) {
      // Clear all data if user logs out or access is being checked
      setEmployeesData([]);
      setInventory([]);
      setCustomersData([]);
      setCurrentUserCustomerData(null);
      setCurrentUserEmployeeData(null);
      setOrdersData([]);
      setInvoicesData([]);
      setDebtsData([]);
      setDisposalLogEntries([]);
      setStorefrontProductIds({});
      setProductNameOptions([]);
      setColorOptions([]);
      setProductQualityOptions([]);
      setSizeOptions([]);
      setUnitOptions([]);
      return;
    }

    const subscriptions: (() => void)[] = [];

    // --- DATA FOR ALL USERS (including customers) ---
    const inventoryRef = ref(db, 'inventory');
    subscriptions.push(onValue(inventoryRef, (snapshot) => {
      const data = snapshot.val();
      const inventoryArray: Product[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setInventory(inventoryArray.sort((a,b) => b.name.localeCompare(a.name)));
    }, (error) => console.error("Error fetching inventory data:", error)));

    const storefrontRef = ref(db, 'storefrontProducts');
    subscriptions.push(onValue(storefrontRef, (snapshot) => {
      setStorefrontProductIds(snapshot.val() || {});
    }));

    // --- ROLE-SPECIFIC DATA ---
    if (isCurrentUserCustomer) {
      // --- Customer-only Data ---
      // For Customers: Load their own orders, but all customers and invoices for the leaderboard
      const customerOrdersQuery = query(ref(db, 'orders'), orderByChild('customerId'), equalTo(currentUser.uid));
      subscriptions.push(onValue(customerOrdersQuery, (snapshot) => {
        const data = snapshot.val();
        const loadedOrders: Order[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setOrdersData(loadedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
      }));

      const allCustomersRef = ref(db, 'customers');
      subscriptions.push(onValue(allCustomersRef, (snapshot) => {
        const data = snapshot.val();
        const customersArray: Customer[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setCustomersData(customersArray);
      }, (error) => console.error("Error fetching all customers for leaderboard:", error)));

      const allInvoicesRef = ref(db, 'invoices');
      subscriptions.push(onValue(allInvoicesRef, (snapshot) => {
        const data = snapshot.val();
        const invoicesArray: Invoice[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setInvoicesData(invoicesArray);
      }, (error) => console.error("Error fetching all invoices for leaderboard:", error)));

    } else {
      // --- Employee & Admin Data ---
      const loadFullDataFor = (path: string, setter: (data: any[]) => void) => {
        const dbRef = ref(db, path);
        subscriptions.push(onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          const loadedData: any[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
          // Sorting logic remains the same
          if (loadedData.length > 0 && loadedData[0].name) {
            loadedData.sort((a, b) => a.name.localeCompare(b.name));
          } else if (loadedData.length > 0 && (loadedData[0].date || loadedData[0].orderDate || loadedData[0].disposalDate)) {
            loadedData.sort((a, b) => new Date(b.date || b.orderDate || b.disposalDate).getTime() - new Date(a.date || a.orderDate || a.disposalDate).getTime());
          }
          setter(loadedData);
        }, (error) => {
          console.error(`Error fetching ${path} data:`, error);
          toast({ title: "Lỗi tải dữ liệu", description: `Không thể tải ${path}.`, variant: "destructive", duration: 2000 });
        }));
      };

      // Load data based on rights
      // All employees (Admin, Manager, Staff) should see the full list of employees and other data.
      // The UI components will handle what to display based on roles.
      loadFullDataFor('employees', setEmployeesData);
      loadFullDataFor('customers', setCustomersData);
      loadFullDataFor('orders', setOrdersData);
      loadFullDataFor('invoices', setInvoicesData);
      loadFullDataFor('debts', setDebtsData);
      loadFullDataFor('disposalLog', setDisposalLogEntries);

      const productOptionRefs = {
        'productOptions/productNames': setProductNameOptions,
        'productOptions/colors': setColorOptions,
        'productOptions/qualities': setProductQualityOptions,
        'productOptions/sizes': setSizeOptions,
        'productOptions/units': setUnitOptions,
      };

      Object.entries(productOptionRefs).forEach(([path, setter]) => {
        const dbRef = ref(db, path);
        subscriptions.push(onValue(dbRef, (snapshot) => {
          setter(snapshot.exists() ? Object.keys(snapshot.val()).sort((a, b) => a.localeCompare(b)) : []);
        }));
      });
    }

    // Cleanup function
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, isLoadingAccessRequest, isCurrentUserCustomer, toast]);
  
  // Effect for ShopInfo (for all logged-in users)
  useEffect(() => {
    if (!currentUser) return; 

    setIsLoadingShopInfo(true);
    const shopInfoRef = ref(db, 'shopInfo');
    const unsubscribeShopInfo = onValue(shopInfoRef, (snapshot) => {
        const defaultInvoiceSettings = {
            showShopLogoOnInvoice: true,
            showShopAddressOnInvoice: true,
            showShopPhoneOnInvoice: true,
            showShopBankDetailsOnInvoice: true,
            showEmployeeNameOnInvoice: true,
            invoiceThankYouMessage: "Cảm ơn quý khách đã mua hàng!",
        };
        if (snapshot.exists()) {
             const dbShopInfo = snapshot.val() as ShopInfo;
             setShopInfo({ ...defaultInvoiceSettings, ...dbShopInfo });
        } else {
            setShopInfo({ 
                name: 'Fleur Manager', 
                address: '', 
                phone: '', 
                logoUrl: '', 
                bankAccountName: '', 
                bankAccountNumber: '', 
                bankName: '', 
                ...defaultInvoiceSettings 
            });
        }
        setIsLoadingShopInfo(false);
    }, (error) => {
        console.error("Error fetching shop info:", error);
        toast({ title: "Lỗi tải thông tin cửa hàng", description: error.message, variant: "destructive", duration: 2000 });
        setIsLoadingShopInfo(false);
    });
    return () => unsubscribeShopInfo();
  }, [currentUser, toast]);


  const handleInvoiceFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setInvoiceFilter(newFilter), []);
  const handleOrderFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setOrderFilter(newFilter), []);
  const handleAnalysisFilterChange = useCallback((newFilter: ActivityDateTimeFilter) => setAnalysisFilter(newFilter), []);


  const filteredInvoicesForInvoiceTab = useMemo(() => filterActivityByDateTimeRange(invoicesData, invoiceFilter), [invoicesData, invoiceFilter]);
  const filteredInvoicesForAnalysis = useMemo(() => filterActivityByDateTimeRange(invoicesData, analysisFilter), [invoicesData, analysisFilter]);
  const filteredDisposalLogForAnalysis = useMemo(() => filterActivityByDateTimeRange(disposalLogEntries.map(d => ({...d, date: d.disposalDate})), analysisFilter), [disposalLogEntries, analysisFilter]);
  
  const filteredDebtsForDebtTab = useMemo(() => {
    // Hiển thị tất cả khách hàng (cả đã trả hết nợ và còn nợ) để có thể kiểm tra lịch sử
    const allDebts = debtsData.filter(debt =>
      debt.customerName &&
      (!debt.customerId || !debt.customerId.startsWith('SUPPLIER_'))
    );

    const groupedByCustomer = allDebts.reduce((acc, debt) => {
      const groupingKey = debt.customerId || debt.customerName;
      if (!groupingKey) return acc; // Skip if no key
      if (!acc[groupingKey]) {
        acc[groupingKey] = [];
      }
      acc[groupingKey].push(debt);
      return acc;
    }, {} as Record<string, Debt[]>);

    return Object.values(groupedByCustomer).map((customerDebts: Debt[]) => {
      // Sort debts to find the earliest one
      const sortedDebts = [...customerDebts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const aggregatedDebt = sortedDebts.reduce((acc, debt) => {
        acc.originalAmount += debt.originalAmount;
        acc.amountPaid += debt.amountPaid;
        acc.remainingAmount += debt.remainingAmount;
        // Combine payments and sort them by date
        acc.payments = [...acc.payments, ...Object.values(debt.payments || {})];
        return acc;
      }, {
        id: sortedDebts[0].customerId || sortedDebts[0].customerName, // Use customerId or name as the unique ID
        customerId: sortedDebts[0].customerId,
        customerName: sortedDebts[0].customerName,
        originalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        date: sortedDebts[0].date, // Use the date of the first debt
        status: 'Còn nợ', // Sẽ được cập nhật bên dưới
        payments: [],
      } as Debt);

      // Cập nhật trạng thái dựa trên số tiền còn lại
      aggregatedDebt.status = aggregatedDebt.remainingAmount <= 0.01 ? 'Đã thanh toán' : 'Còn nợ';

      aggregatedDebt.payments.sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
      
      return aggregatedDebt;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [debtsData]);
  
  const filteredOrdersForOrderTab = useMemo(() => {
    const userFilteredOrders = isCurrentUserCustomer
      ? ordersData.filter(o => o.customerId === currentUser?.uid)
      : ordersData;
    return filterActivityByDateTimeRange(userFilteredOrders.map(o => ({...o, date: o.orderDate })), orderFilter);
  }, [ordersData, orderFilter, isCurrentUserCustomer, currentUser]);

  const storefrontProducts = useMemo(() => {
    return inventory.filter(p => storefrontProductIds[p.id]);
  }, [inventory, storefrontProductIds]);

  const productSalesSummaryData = useMemo((): ProductSalesSummary => {
    const summary: ProductSalesSummary = {};
    if (!invoicesData || invoicesData.length === 0) {
      return summary;
    }

    const ninetyDaysAgo = subDays(new Date(), 90);

    invoicesData.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      if (invoiceDate >= ninetyDaysAgo) {
        invoice.items.forEach(item => {
          const productId = item.id; // Assuming item.id is the productId
          if (!summary[productId]) {
            summary[productId] = {
              productId: productId,
              totalQuantitySold: 0,
              lastSaleDate: undefined,
            };
          }
          summary[productId].totalQuantitySold += item.quantityInCart;
          if (!summary[productId].lastSaleDate || invoiceDate > new Date(summary[productId].lastSaleDate!)) {
            summary[productId].lastSaleDate = invoice.date;
          }
        });
      }
    });
    return summary;
  }, [invoicesData]);

  const identifiedSlowMovingProductsData = useMemo((): IdentifiedSlowMovingProduct[] => {
    const LOW_SALES_THRESHOLD = 2;
    const DAYS_SINCE_LAST_SALE_THRESHOLD = 60;
    const results: IdentifiedSlowMovingProduct[] = [];

    if (!inventory || !productSalesSummaryData) {
      return results;
    }

    inventory.forEach(product => {
      if (product.quantity <= 0) {
        return; // Skip if not in stock
      }

      const salesInfo = productSalesSummaryData[product.id];
      let isSlowMoving = false;
      let daysSinceLastSale: number | undefined = undefined;
      const totalQuantitySoldLast90Days = salesInfo?.totalQuantitySold ?? 0;
      const lastSaleDate = salesInfo?.lastSaleDate;

      if (!salesInfo) {
        isSlowMoving = true; // No sales in the last 90 days
        if(product.quantity > 0) daysSinceLastSale = 90; // Assume it hasn't sold for at least 90 days
      } else {
        if (salesInfo.totalQuantitySold <= LOW_SALES_THRESHOLD) {
          isSlowMoving = true;
        }
        if (salesInfo.lastSaleDate) {
          const diff = differenceInDays(new Date(), new Date(salesInfo.lastSaleDate));
          daysSinceLastSale = diff;
          if (diff > DAYS_SINCE_LAST_SALE_THRESHOLD) {
            isSlowMoving = true;
          }
        } else { // Has sales record (totalQuantitySold > 0) but no lastSaleDate
             if (salesInfo.totalQuantitySold > 0 && product.quantity > 0) { // If it sold but no date, assume it's been > 90 days for this metric
                daysSinceLastSale = 90; // Placeholder, actual date unknown but it sold
             }
        }
      }

      if (isSlowMoving) {
        results.push({
          ...product,
          totalQuantitySoldLast90Days: totalQuantitySoldLast90Days,
          lastSaleDate: lastSaleDate,
          daysSinceLastSale: daysSinceLastSale,
        });
      }
    });
    return results.sort((a,b) => (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0)); // Sort by daysSinceLastSale descending
  }, [inventory, productSalesSummaryData]);
  
  const productSalesDetails = useMemo((): ProductSalesDetail[] => {
    if (!inventory || !invoicesData) {
      return [];
    }

    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);
    const ninetyDaysAgo = subDays(today, 90);

    return inventory.map(product => {
      let totalQuantitySold = 0;
      let salesInLast30Days = 0;
      let salesInLast60Days = 0;
      let salesInLast90Days = 0;
      let lastSaleDate: string | undefined = undefined;

      invoicesData.forEach(invoice => {
        const invoiceDate = new Date(invoice.date);
        invoice.items.forEach(item => {
          if (item.id === product.id) {
            totalQuantitySold += item.quantityInCart;
            if (!lastSaleDate || invoiceDate > new Date(lastSaleDate)) {
              lastSaleDate = invoice.date;
            }
            if (invoiceDate >= thirtyDaysAgo) {
              salesInLast30Days += item.quantityInCart;
            }
            if (invoiceDate >= sixtyDaysAgo) {
              salesInLast60Days += item.quantityInCart;
            }
            if (invoiceDate >= ninetyDaysAgo) {
              salesInLast90Days += item.quantityInCart;
            }
          }
        });
      });

      return {
        productId: product.id,
        name: product.name,
        color: product.color,
        quality: product.quality,
        size: product.size,
        unit: product.unit,
        images: product.images,
        currentStock: product.quantity,
        totalQuantitySold,
        lastSaleDate,
        salesInLast30Days,
        salesInLast60Days,
        salesInLast90Days,
      };
    });
  }, [inventory, invoicesData]);

  const customerInsightsData = useMemo((): CustomerInsight => {
    const filteredInvoices = filteredInvoicesForAnalysis;
    if (!filteredInvoices.length || !customersData.length) {
      return {
        topCustomersByRevenue: [],
        topCustomersByInvoiceCount: [],
        newVsReturning: { new: 0, returning: 0 }
      };
    }

    const customerStats: Record<string, {
      name: string;
      totalRevenue: number;
      invoiceCount: number;
      lastPurchaseDate: Date;
    }> = {};

    filteredInvoices.forEach(invoice => {
      if (!invoice.customerId) return;

      const customer = customersData.find(c => c.id === invoice.customerId);
      if (!customer) return;

      if (!customerStats[invoice.customerId]) {
        customerStats[invoice.customerId] = {
          name: customer.name,
          totalRevenue: 0,
          invoiceCount: 0,
          lastPurchaseDate: new Date(invoice.date),
        };
      }
      
      const stats = customerStats[invoice.customerId];
      // Chỉ tính số tiền đã thanh toán thực tế, không tính số tiền nợ
      const paidAmount = invoice.amountPaid || 0;
      stats.totalRevenue += paidAmount;
      stats.invoiceCount += 1;
      const invoiceDate = new Date(invoice.date);
      if (invoiceDate > stats.lastPurchaseDate) {
        stats.lastPurchaseDate = invoiceDate;
      }
    });

    const allCustomerStats = Object.entries(customerStats).map(([customerId, data]) => ({ customerId, ...data }));

    const topCustomersByRevenue = [...allCustomerStats]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map(c => ({...c, lastPurchaseDate: c.lastPurchaseDate.toISOString()}));

    const topCustomersByInvoiceCount = [...allCustomerStats]
      .sort((a, b) => b.invoiceCount - a.invoiceCount)
      .slice(0, 10)
      .map(c => ({...c, lastPurchaseDate: c.lastPurchaseDate.toISOString()}));

    const newVsReturning = { new: 0, returning: 0 };
    const filterStartDate = analysisFilter.startDate ? getCombinedDateTime(analysisFilter.startDate, analysisFilter.startHour, analysisFilter.startMinute) : null;

    const allInvoicesByCustomer: Record<string, Date[]> = {};
    invoicesData.forEach(inv => {
        if(inv.customerId) {
            if(!allInvoicesByCustomer[inv.customerId]) {
                allInvoicesByCustomer[inv.customerId] = [];
            }
            allInvoicesByCustomer[inv.customerId].push(new Date(inv.date));
        }
    });

    const customersInFilter = new Set(filteredInvoices.map(inv => inv.customerId));

    customersInFilter.forEach(customerId => {
        if(!customerId) return;
        const firstInvoiceDateOverall = allInvoicesByCustomer[customerId]?.sort((a,b) => a.getTime() - b.getTime())[0];
        if(firstInvoiceDateOverall && filterStartDate && firstInvoiceDateOverall >= filterStartDate) {
            newVsReturning.new += 1;
        } else {
            newVsReturning.returning += 1;
        }
    });

    return { topCustomersByRevenue, topCustomersByInvoiceCount, newVsReturning };
  }, [filteredInvoicesForAnalysis, customersData, invoicesData, analysisFilter]);

  const salesByHourData = useMemo((): SalesByHour[] => {
    const filteredInvoices = filteredInvoicesForAnalysis;
    const sales: Record<string, { sales: number; revenue: number }> = {};

    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        sales[hour] = { sales: 0, revenue: 0 };
    }

    filteredInvoices.forEach(invoice => {
        const hour = new Date(invoice.date).getHours().toString().padStart(2, '0');
        if (sales[hour]) {
            sales[hour].sales += 1;
            sales[hour].revenue += invoice.total;
        }
    });

    return Object.entries(sales).map(([hour, data]) => ({
        hour: `${hour}:00`,
        ...data,
    }));
  }, [filteredInvoicesForAnalysis]);


  const handleAddCustomer = useCallback(async (newCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => { try { const newCustomerRef = push(ref(db, 'customers')); await set(newCustomerRef, newCustomerData); toast({ title: "Thành công", description: "Khách hàng đã được thêm.", variant: "default", duration: 2000 }); } catch (error) { console.error("Error adding customer:", error); toast({ title: "Lỗi", description: "Không thể thêm khách hàng. Vui lòng thử lại.", variant: "destructive", duration: 2000 }); } }, [toast]);
  const handleUpdateCustomer = useCallback(async (customerId: string, updatedCustomerData: Omit<Customer, 'id' | 'email' | 'zaloName'> & { zaloName?: string }) => { try { await update(ref(db, `customers/${customerId}`), updatedCustomerData); toast({ title: "Thành công", description: "Thông tin khách hàng đã được cập nhật.", variant: "default", duration: 2000 }); } catch (error) { console.error("Error updating customer:", error); toast({ title: "Lỗi", description: "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại.", variant: "destructive", duration: 2000 }); } }, [toast]);
  const handleDeleteCustomer = useCallback(async (customerId: string) => { if (!hasFullAccessRights) { toast({ title: "Không có quyền", description: "Bạn không có quyền xóa khách hàng.", variant: "destructive", duration: 2000 }); return; } try { await remove(ref(db, `customers/${customerId}`)); toast({ title: "Thành công", description: "Khách hàng đã được xóa.", variant: "default", duration: 2000 }); } catch (error) { console.error("Error deleting customer:", error); toast({ title: "Lỗi", description: "Không thể xóa khách hàng. Vui lòng thử lại.", variant: "destructive", duration: 2000 }); } }, [toast, hasFullAccessRights]);

  const onRemoveFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const onUpdateCartQuantity = useCallback((itemId: string, newQuantityStr: string) => {
    if (newQuantityStr.trim() === '') {
        setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: 0 } : item));
        return;
    }

    const newQuantity = parseInt(newQuantityStr, 10);
    
    if (newQuantity <= 0) {
        onRemoveFromCart(itemId);
        return;
    }

    if (isNaN(newQuantity) || newQuantity < 0) {
        return; 
    }

    const stockItem = inventory.find(i => i.id === itemId);

    if (!stockItem) {
        toast({ title: "Sản phẩm không tồn tại", description: "Sản phẩm này đã bị xóa khỏi kho.", variant: "destructive", duration: 2000 });
        onRemoveFromCart(itemId);
        return;
    }

    if (newQuantity > stockItem.quantity) {
      toast({ title: "Số lượng không đủ", description: `Chỉ còn ${stockItem.quantity} ${stockItem.unit} trong kho.`, variant: "destructive", duration: 2000 });
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: stockItem.quantity } : item));
    } else {
      setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  }, [inventory, toast, onRemoveFromCart]);

  const onAddToCart = useCallback((item: Product) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const stockItem = inventory.find(i => i.id === item.id);

    if (!stockItem || stockItem.quantity <= 0) {
      toast({ title: "Hết hàng", description: `Sản phẩm "${item.name} ${item.color} ${item.quality} ${item.size} ${item.unit}" đã hết hàng!`, variant: "destructive", duration: 2000 });
      return;
    }

    if (existingItem) {
      const newQuantityInCart = existingItem.quantityInCart + 1;
      if (newQuantityInCart <= stockItem.quantity) {
        onUpdateCartQuantity(item.id, newQuantityInCart.toString());
      } else {
        toast({ title: "Số lượng tối đa", description: `Không đủ số lượng "${item.name} ${item.color} ${item.quality} ${item.size} ${item.unit}" trong kho (Còn: ${stockItem.quantity}).`, variant: "destructive", duration: 2000 });
      }
    } else {
      setCart(prevCart => [...prevCart, { ...item, quantityInCart: 1, itemDiscount: 0 }]);
    }
    // No longer need to set temporary animation state here.
  }, [cart, inventory, toast, onUpdateCartQuantity]);

  const onItemDiscountChange = useCallback((itemId: string, discountNghinStr: string): boolean => {
    let inputWasInvalid = false;
    const currentItemInCartFromState = cart.find(i => i.id === itemId);

    if (!currentItemInCartFromState) {
        console.error("Item not found in cart for discount change:", itemId);
        return false;
    }

    const discountNghin = parseFloat(discountNghinStr);
    let validatedDiscountForItem = isNaN(discountNghin) ? 0 : discountNghin * 1000;
    const itemOriginalTotal = currentItemInCartFromState.price * currentItemInCartFromState.quantityInCart;

    if (validatedDiscountForItem < 0) {
        toast({ title: "Lỗi giảm giá", description: "Số tiền giảm giá cho sản phẩm không thể âm.", variant: "destructive", duration: 2000 });
        validatedDiscountForItem = 0;
        inputWasInvalid = true;
    } else {
         if (validatedDiscountForItem > itemOriginalTotal) {
             toast({ title: "Lỗi giảm giá", description: `Giảm giá cho sản phẩm "${currentItemInCartFromState.name}" không thể lớn hơn tổng tiền của sản phẩm đó (${(itemOriginalTotal / 1000).toLocaleString('vi-VN')}K).`, variant: "destructive", duration: 2000 });
            validatedDiscountForItem = itemOriginalTotal;
            inputWasInvalid = true;
        }
    }

    setCart(prevCart =>
        prevCart.map(item =>
            item.id === itemId ? { ...item, itemDiscount: validatedDiscountForItem } : item
        )
    );
    return inputWasInvalid;
  }, [cart, toast]);

  const onClearCart = useCallback(() => { setCart([]); }, []);
  const handleCreateInvoice = useCallback(async (customerName: string, invoiceCartItems: CartItem[], subtotalAfterItemDiscounts: number, paymentMethod: string, amountPaid: number, isGuestCustomer: boolean, employeeId: string, employeeName: string, tierDiscount: number) => {
    try {
      const finalTotal = subtotalAfterItemDiscounts;
      let calculatedDebtAmount = 0;

      if (finalTotal < 0) {
        toast({ title: "Lỗi tính toán", description: "Tổng tiền sau giảm giá không thể âm. Vui lòng kiểm tra lại giảm giá.", variant: "destructive", duration: 2000 });
        return false;
      }

      if (finalTotal > amountPaid) {
        calculatedDebtAmount = finalTotal - amountPaid;
        if (isGuestCustomer || paymentMethod === 'Chuyển khoản') {
          toast({ title: "Lỗi thanh toán", description: "Khách lẻ hoặc thanh toán bằng Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ số tiền.", variant: "destructive", duration: 2000 });
          return false;
        }
      }

      let customerId = '';
      const normalizedCustomerName = customerName.trim();

      if (!isGuestCustomer) {
        const customer = customersData.find(c => c.name.trim() === normalizedCustomerName);
        if (customer) {
          customerId = customer.id;
        } else {
          console.warn(`Customer "${normalizedCustomerName}" not found. Invoice will lack a customerId.`);
        }
      }

      const newInvoiceRef = push(ref(db, 'invoices'));
      const invoiceId = newInvoiceRef.key;
      if (!invoiceId) {
        throw new Error("Không thể tạo ID cho hóa đơn mới.");
      }
      const itemsForDb: InvoiceCartItem[] = invoiceCartItems.map(item => ({ id: item.id, name: item.name, quality: item.quality, quantityInCart: item.quantityInCart, price: item.price, costPrice: item.costPrice ?? 0, images: item.images, color: item.color, size: item.size, unit: item.unit, itemDiscount: item.itemDiscount || 0 }));
      const newInvoiceData: Omit<Invoice, 'id'> = {
        customerId: customerId,
        customerName: normalizedCustomerName,
        items: itemsForDb,
        total: finalTotal,
        date: new Date().toISOString(),
        paymentMethod,
        discount: tierDiscount,
        amountPaid,
        employeeId,
        employeeName: employeeName || 'Không rõ',
        ...(calculatedDebtAmount > 0 && { debtAmount: calculatedDebtAmount }),
      };
      await set(newInvoiceRef, newInvoiceData);
      if (calculatedDebtAmount > 0) {
        const newDebtRef = push(ref(db, 'debts'));
        const newDebt: Omit<Debt, 'id'> = {
          customerId: customerId,
          customerName: normalizedCustomerName,
          originalAmount: calculatedDebtAmount,
          amountPaid: 0,
          remainingAmount: calculatedDebtAmount,
          date: new Date().toISOString(),
          status: 'Còn nợ',
          invoiceId: invoiceId,
          payments: [],
          createdEmployeeId: employeeId,
          createdEmployeeName: employeeName || 'Không rõ',
        };
        await set(newDebtRef, newDebt);
        
        // Log debt creation history
        await logDebtCreation(
          customerId,
          normalizedCustomerName,
          calculatedDebtAmount,
          employeeId,
          employeeName || 'Không rõ',
          invoiceId,
          paymentMethod
        );
      }
      const updates: { [key: string]: any } = {};
      for (const cartItem of invoiceCartItems) {
        const productSnapshot = await get(child(ref(db), `inventory/${cartItem.id}`));
        if (productSnapshot.exists()) {
          const currentQuantity = productSnapshot.val().quantity;
          updates[`inventory/${cartItem.id}/quantity`] = currentQuantity - cartItem.quantityInCart;
        } else {
          throw new Error(`Sản phẩm ID ${cartItem.id} không tồn tại để cập nhật số lượng.`);
        }
      }
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
        
        // Đánh số lại lô hàng sau khi cập nhật số lượng
        await reorderBatchNumbers();
      }

      if (customerId) {
        const customerRef = ref(db, `customers/${customerId}`);
        const customerSnapshot = await get(customerRef);
        if (customerSnapshot.exists()) {
          const customerData = customerSnapshot.val();
          const pointsEarned = calculatePoints(finalTotal, customerData.tier, amountPaid);
          if (pointsEarned > 0) {
            const newPoints = (customerData.points || 0) + pointsEarned;
            const newHistoryEntryRef = push(ref(db, `customers/${customerId}/pointsHistory`));
            const newHistoryEntry = {
              id: newHistoryEntryRef.key,
              points: pointsEarned,
              date: new Date().toISOString(),
              reason: 'earn',
              invoiceId: invoiceId,
            };
            updates[`customers/${customerId}/points`] = newPoints;
            updates[`customers/${customerId}/pointsHistory/${newHistoryEntryRef.key}`] = newHistoryEntry;
            updates[`invoices/${invoiceId}/pointsEarned`] = pointsEarned;
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Hóa đơn đã được tạo. Khách hàng nhận được ${pointsEarned} điểm.`, variant: "default", duration: 3000 });
          } else {
            toast({ title: "Thành công", description: "Hóa đơn đã được tạo và kho đã cập nhật.", variant: "default", duration: 2000 });
          }
        }
      } else {
        toast({ title: "Thành công", description: "Hóa đơn đã được tạo và kho đã cập nhật.", variant: "default", duration: 2000 });
      }

      onClearCart();
      return true;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({ title: "Lỗi", description: `Không thể tạo hóa đơn: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive", duration: 2000 });
      return false;
    }
  }, [toast, onClearCart, customersData]);

  const handleProcessInvoiceCancellationOrReturn = useCallback(async (invoiceId: string, operationType: 'delete' | 'return', itemsToReturnArray?: Array<{ productId: string; name: string; quantityToReturn: number }>) => {
    const canPerformOperation = operationType === 'delete' ? hasFullAccessRights : true;
    if (!canPerformOperation) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
      return false;
    }

    try {
      const invoiceSnapshot = await get(child(ref(db), `invoices/${invoiceId}`));
      if (!invoiceSnapshot.exists()) {
        toast({ title: "Lỗi", description: "Không tìm thấy hóa đơn để xử lý.", variant: "destructive", duration: 2000 });
        return false;
      }
      const originalInvoice = { id: invoiceId, ...invoiceSnapshot.val() } as Invoice;
      const updates: { [key: string]: any } = {};
      const deleteAssociatedDebtIfNeeded = async () => {
        // Only proceed if the invoice actually had a debt amount.
        if (originalInvoice.debtAmount && originalInvoice.debtAmount > 0) {
          // Create a query to find the debt record associated with this invoiceId.
          const debtsQuery = query(ref(db, 'debts'), orderByChild('invoiceId'), equalTo(invoiceId));
          const snapshot = await get(debtsQuery);
          
          if (snapshot.exists()) {
            // Since invoiceId should be unique per debt, we expect at most one result.
            // We loop through the results (even if it's just one) to get the debt's key.
            snapshot.forEach((childSnapshot) => {
              updates[`debts/${childSnapshot.key}`] = null; // Mark the found debt for deletion.
            });
          }
        }
      };

      if (operationType === 'delete' || (operationType === 'return' && (!itemsToReturnArray || itemsToReturnArray.length === 0))) {
        for (const invoiceItem of originalInvoice.items) {
          const productRef = child(ref(db), `inventory/${invoiceItem.id}`);
          const productSnapshot = await get(productRef);
          if (productSnapshot.exists()) {
            updates[`inventory/${invoiceItem.id}/quantity`] = productSnapshot.val().quantity + invoiceItem.quantityInCart;
          } else {
            console.warn(`Sản phẩm ID ${invoiceItem.id} (tên: ${invoiceItem.name}) trong hóa đơn ${invoiceId} không còn tồn tại trong kho. Không thể hoàn kho cho sản phẩm này.`);
          }
        }
        updates[`invoices/${invoiceId}`] = null;
        await deleteAssociatedDebtIfNeeded();
        await update(ref(db), updates);
        const message = operationType === 'delete' ? "Hóa đơn đã được xóa và các sản phẩm (nếu còn) đã hoàn kho." : "Hoàn trả toàn bộ hóa đơn thành công, sản phẩm (nếu còn) đã hoàn kho.";
        if (originalInvoice.debtAmount && originalInvoice.debtAmount > 0) {
          toast({ title: "Thành công", description: `${message} Công nợ liên quan (nếu có) đã được xóa.`, variant: "default", duration: 2000 });
        } else {
          toast({ title: "Thành công", description: message, variant: "default", duration: 2000 });
        }
        return true;
      } else if (operationType === 'return' && itemsToReturnArray && itemsToReturnArray.length > 0) {
        for (const itemToReturn of itemsToReturnArray) {
          if (itemToReturn.quantityToReturn > 0) {
            const productRef = child(ref(db), `inventory/${itemToReturn.productId}`);
            const productSnapshot = await get(productRef);
            if (productSnapshot.exists()) {
              updates[`inventory/${itemToReturn.productId}/quantity`] = productSnapshot.val().quantity + itemToReturn.quantityToReturn;
            } else {
              console.warn(`Sản phẩm ID ${itemToReturn.productId} (tên: ${itemToReturn.name}) dự kiến hoàn trả từ hóa đơn ${invoiceId} không còn tồn tại trong kho. Không thể hoàn kho cho sản phẩm này.`);
            }
          }
        }
        const newInvoiceItems: InvoiceCartItem[] = [];
        let newSubtotalAfterItemDiscounts = 0;
        for (const originalItem of originalInvoice.items) {
          const returnedItemInfo = itemsToReturnArray.find(rt => rt.productId === originalItem.id);
          const quantityReturned = returnedItemInfo ? returnedItemInfo.quantityToReturn : 0;
          const remainingQuantityInCart = originalItem.quantityInCart - quantityReturned;
          if (remainingQuantityInCart > 0) {
            const newItem: InvoiceCartItem = { ...originalItem, quantityInCart: remainingQuantityInCart, };
            newInvoiceItems.push(newItem);
            newSubtotalAfterItemDiscounts += (newItem.price * remainingQuantityInCart) - (newItem.itemDiscount || 0);
          }
        }

        const newFinalTotal = newSubtotalAfterItemDiscounts;

        if (newInvoiceItems.length === 0 || newFinalTotal <= 0) {
          updates[`invoices/${invoiceId}`] = null;
          await deleteAssociatedDebtIfNeeded();
          await update(ref(db), updates);
          toast({ title: "Thành công", description: "Tất cả sản phẩm đã được hoàn trả, hóa đơn và công nợ liên quan (nếu có) đã được xóa.", variant: "default", duration: 2000 });
        } else {
          updates[`invoices/${invoiceId}/items`] = newInvoiceItems;
          updates[`invoices/${invoiceId}/total`] = newFinalTotal;
          updates[`invoices/${invoiceId}/discount`] = 0;
          toast({ title: "Thành công", description: "Hoàn trả một phần thành công, kho và hóa đơn đã cập nhật. Công nợ gốc (nếu có) không thay đổi trừ khi được xử lý riêng.", variant: "default", duration: 2000 });
        }
        await update(ref(db), updates);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error processing invoice ${operationType} for ID ${invoiceId}:`, error);
      const errorMessage = operationType === 'delete' ? "Không thể xóa hóa đơn." : "Không thể xử lý hoàn trả.";
      toast({ title: "Lỗi", description: `${errorMessage} Vui lòng thử lại. ${error instanceof Error ? error.message : String(error)}`, variant: "destructive", duration: 2000 });
      return false;
    }
  }, [toast, hasFullAccessRights]);

  const handleImportProducts = useCallback(async (
    supplierName: string | undefined, 
    itemsToSubmit: {
      productId: string;
      quantity: number;
      costPriceVND: number;
      salePriceVND: number; // Thêm giá bán
      batchNumber: number; // Batch number đã được tính tự động trong frontend
      priceAction?: 'keep' | 'update';
    }[], 
    totalCostVND: number, 
    employeeId: string, 
    employeeName: string
  ) => { 
    try { 
      console.log('🔍 handleImportProducts received:', {
        itemsToSubmit,
        totalCostVND,
        itemsDetails: itemsToSubmit.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPriceVND: item.costPriceVND,
          salePriceVND: item.salePriceVND, // Log giá bán
          batchNumber: item.batchNumber, // Log số lô hàng đã được tính tự động
          isNaN_quantity: isNaN(item.quantity),
          isNaN_costPriceVND: isNaN(item.costPriceVND),
          isNaN_salePriceVND: isNaN(item.salePriceVND)
        }))
      });
      
      const supplierId = `SUPPLIER_${supplierName?.replace(/\s/g, '_') || 'UNKNOWN'}`;
      const supplierDisplayName = supplierName || "Nhà cung cấp không xác định";
      
      const newDebtRef = push(ref(db, 'debts')); 
      const newDebt: Omit<Debt, 'id'> = { 
        customerId: supplierId, 
        customerName: supplierDisplayName, 
        originalAmount: totalCostVND, 
        amountPaid: 0, 
        remainingAmount: totalCostVND, 
        date: new Date().toISOString(), 
        status: 'Còn nợ', 
        payments: [], 
        createdEmployeeId: employeeId, 
        createdEmployeeName: employeeName || 'Không rõ', 
      }; 
      await set(newDebtRef, newDebt); 
      
      // Log debt creation history for supplier
      await logDebtCreation(
        supplierId,
        supplierDisplayName,
        totalCostVND,
        employeeId,
        employeeName || 'Không rõ'
      );
      
      const updates: { [key: string]: any } = {}; 
      for (const importItem of itemsToSubmit) { 
        const productSnapshot = await get(child(ref(db), `inventory/${importItem.productId}`)); 
        if (productSnapshot.exists()) { 
          const currentProduct = productSnapshot.val(); 
          
          console.log(`🔨 Creating new batch for product ${importItem.productId}:`, {
            currentProduct: currentProduct,
            autoBatchNumber: importItem.batchNumber, // Batch number đã được tính tự động
            quantity: importItem.quantity,
            costPriceVND: importItem.costPriceVND,
            salePriceVND: importItem.salePriceVND
          });
          
          // LUÔN TẠO SẢN PHẨM MỚI với batch number tự động và giá riêng biệt
          const newProductRef = push(ref(db, 'inventory'));
          
          // Tạo object an toàn, loại bỏ undefined values
          const newProductData: any = {
            name: currentProduct.name,
            color: currentProduct.color,
            size: currentProduct.size || '',
            unit: currentProduct.unit || '',
            quantity: importItem.quantity, // Số lượng của lô mới
            costPrice: importItem.costPriceVND, // Giá gốc của lô mới (VND)
            price: importItem.salePriceVND, // Giá bán của lô mới (VND)
            batchNumber: importItem.batchNumber, // Số lô hàng mới
            images: currentProduct.images || [],
            description: currentProduct.description || ''
          };
          
          // Chỉ thêm quality nếu nó có giá trị hợp lệ
          if (currentProduct.quality && currentProduct.quality !== 'none') {
            newProductData.quality = currentProduct.quality;
          }
          
          console.log(`🔨 Creating new product data:`, newProductData);
          
          // Đảm bảo không có NaN values
          if (isNaN(newProductData.quantity) || isNaN(newProductData.costPrice) || isNaN(newProductData.price) || isNaN(newProductData.batchNumber)) {
            console.error(`NaN detected for new product batch:`, {
              quantity: newProductData.quantity,
              costPrice: newProductData.costPrice,
              price: newProductData.price,
              batchNumber: newProductData.batchNumber,
              importItem
            });
            continue; // Skip this item
          }
          
          updates[`inventory/${newProductRef.key}`] = newProductData;
          
          console.log(`✅ Will create new product with ID ${newProductRef.key} - Auto Batch ${importItem.batchNumber}`);
        } else { 
          console.warn(`Sản phẩm ID ${importItem.productId} không tìm thấy trong kho khi nhập hàng. Bỏ qua cập nhật cho sản phẩm này.`); 
        } 
      } 
      if (Object.keys(updates).length > 0) { 
        await update(ref(db), updates); 
        console.log(`✅ Successfully created ${Object.keys(updates).filter(key => key.startsWith('inventory/')).length} new product batches`);
      }
      
      // TODO: Add import history logging once Firebase rules are updated
      // const importRecord = {
      //   supplierId,
      //   supplierName: supplierDisplayName,
      //   employeeId,
      //   employeeName: employeeName || 'Không rõ',
      //   importDate: Date.now(),
      //   itemsToSubmit,
      //   totalCostVND,
      //   itemsDetails: itemsToSubmit.map(item => ({
      //     productId: item.productId,
      //     quantity: item.quantity,
      //     costPriceVND: item.costPriceVND,
      //     salePriceVND: item.salePriceVND,
      //     batchNumber: item.batchNumber,
      //     priceAction: item.priceAction
      //   }))
      // };
      // await set(ref(db, `importHistory/${Date.now()}`), importRecord);
      
      const newBatchCount = Object.keys(updates).filter(key => key.startsWith('inventory/')).length;
      toast({ 
        title: "Thành công", 
        description: `Đã tạo ${newBatchCount} lô hàng mới với batch number tự động. Công nợ đã được cập nhật.`, 
        variant: "default", 
        duration: 3000 
      }); 
      return true; 
    } catch (error) { 
      console.error("Error importing products:", error); 
      toast({ title: "Lỗi", description: "Không thể nhập hàng. Vui lòng thử lại.", variant: "destructive", duration: 2000 }); 
      return false; 
    } 
  }, [toast]);
  
  const handleAddPayment = useCallback(async (customerGroupingKey: string, amount: number, notes: string, employeeId: string, employeeName: string) => {
    if (!currentUser) {
      toast({ title: "Lỗi", description: "Yêu cầu đăng nhập.", variant: "destructive", duration: 2000 });
      return;
    }

    // Get all unpaid debts for the customer, sorted oldest first
    const customerDebts = debtsData
      .filter(d => {
        if (!d.remainingAmount || d.remainingAmount <= 0) return false;
        const key = d.customerId || d.customerName;
        return key === customerGroupingKey;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (customerDebts.length === 0) {
      toast({ title: "Lỗi", description: "Không tìm thấy công nợ cho khách hàng này.", variant: "destructive", duration: 2000 });
      return;
    }

    let paymentAmountToApply = Number(amount);
    if (isNaN(paymentAmountToApply) || paymentAmountToApply <= 0) {
      toast({ title: "Lỗi", description: "Số tiền thanh toán không hợp lệ.", variant: "destructive", duration: 2000 });
      return;
    }
    
    const totalRemaining = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    if (paymentAmountToApply > totalRemaining) {
        toast({ title: "Lỗi", description: `Số tiền thanh toán (${paymentAmountToApply.toLocaleString('vi-VN')} VNĐ) lớn hơn tổng nợ còn lại (${totalRemaining.toLocaleString('vi-VN')} VNĐ).`, variant: "destructive", duration: 2000 });
        return;
    }

    const updates: { [key: string]: any } = {};
    const paymentsToLog: Array<{ customerId: string; customerName: string; amount: number; remainingDebt: number; debtId: string; }> = [];

    for (const debt of customerDebts) {
      if (paymentAmountToApply <= 0) break;

      const paymentForThisDebt = Math.min(paymentAmountToApply, debt.remainingAmount);
      
      const newPaymentRef = push(ref(db, `debts/${debt.id}/payments`));
      const newPayment = {
        id: newPaymentRef.key!,
        paymentDate: new Date().toISOString(),
        amountPaid: paymentForThisDebt,
        employeeId,
        employeeName,
        notes,
      };

      const newAmountPaid = debt.amountPaid + paymentForThisDebt;
      const newRemainingAmount = debt.originalAmount - newAmountPaid;
      const newStatus: DebtStatus = newRemainingAmount <= 0.01 ? 'Đã thanh toán' : 'Còn nợ'; // Use tolerance for float issues

      updates[`debts/${debt.id}/payments/${newPayment.id}`] = newPayment;
      updates[`debts/${debt.id}/amountPaid`] = newAmountPaid;
      updates[`debts/${debt.id}/remainingAmount`] = newRemainingAmount;
      updates[`debts/${debt.id}/status`] = newStatus;
      updates[`debts/${debt.id}/lastUpdatedEmployeeId`] = employeeId;
      updates[`debts/${debt.id}/lastUpdatedEmployeeName`] = employeeName;

      // Store payment info for logging
      paymentsToLog.push({
        customerId: debt.customerId || debt.customerName,
        customerName: debt.customerName,
        amount: paymentForThisDebt,
        remainingDebt: newRemainingAmount,
        debtId: debt.id
      });

      paymentAmountToApply -= paymentForThisDebt;

      // Sync with Invoice if it exists
      if (debt.invoiceId) {
        const invoiceToUpdate = invoicesData.find(inv => inv.id === debt.invoiceId);
        if (invoiceToUpdate) {
          const newInvoiceDebtAmount = (invoiceToUpdate.debtAmount || 0) - paymentForThisDebt;
          const newInvoiceAmountPaid = (invoiceToUpdate.amountPaid || 0) + paymentForThisDebt;
          updates[`invoices/${debt.invoiceId}/debtAmount`] = newInvoiceDebtAmount < 0 ? 0 : newInvoiceDebtAmount;
          updates[`invoices/${debt.invoiceId}/amountPaid`] = newInvoiceAmountPaid;
          
        } else {
          console.warn(`Could not find invoice with ID ${debt.invoiceId} to sync payment.`);
        }
      }
    }

    try {
      await update(ref(db), updates);
      
      // Log payment history for each debt payment
      for (const paymentInfo of paymentsToLog) {
        await logDebtPayment(
          paymentInfo.customerId,
          paymentInfo.customerName,
          paymentInfo.amount,
          paymentInfo.remainingDebt,
          employeeId,
          employeeName,
          notes,
          paymentInfo.debtId
        );
      }

      // Tích điểm cho khách hàng khi trả nợ
      const totalPaymentAmount = paymentsToLog.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPaymentAmount > 0) {
        const firstPayment = paymentsToLog[0];
        if (firstPayment && firstPayment.customerId) {
          const customerRef = ref(db, `customers/${firstPayment.customerId}`);
          const customerSnapshot = await get(customerRef);
          if (customerSnapshot.exists()) {
            const customerData = customerSnapshot.val();
            const pointsEarned = calculatePoints(0, customerData.tier, totalPaymentAmount);
            if (pointsEarned > 0) {
              const newPoints = (customerData.points || 0) + pointsEarned;
              const newHistoryEntryRef = push(ref(db, `customers/${firstPayment.customerId}/pointsHistory`));
              const newHistoryEntry = {
                id: newHistoryEntryRef.key,
                points: pointsEarned,
                date: new Date().toISOString(),
                reason: 'earn',
                description: 'Tích điểm từ thanh toán nợ',
              };
              const pointUpdates: { [key: string]: any } = {};
              pointUpdates[`customers/${firstPayment.customerId}/points`] = newPoints;
              pointUpdates[`customers/${firstPayment.customerId}/pointsHistory/${newHistoryEntryRef.key}`] = newHistoryEntry;
              await update(ref(db), pointUpdates);
              
              toast({ title: "Thành công", description: `Đã ghi nhận thanh toán. Khách hàng nhận được ${pointsEarned} điểm.`, duration: 3000 });
            } else {
              toast({ title: "Thành công", description: "Đã ghi nhận thanh toán.", duration: 2000 });
            }
          } else {
            toast({ title: "Thành công", description: "Đã ghi nhận thanh toán.", duration: 2000 });
          }
        } else {
          toast({ title: "Thành công", description: "Đã ghi nhận thanh toán.", duration: 2000 });
        }
      } else {
        toast({ title: "Thành công", description: "Đã ghi nhận thanh toán.", duration: 2000 });
      }

      // Manually update the local state to ensure UI reflects the change immediately
      setDebtsData(prevDebts => {
        const newDebts = [...prevDebts];
        Object.keys(updates).forEach(updatePath => {
          const pathParts = updatePath.split('/');
          if (pathParts[0] === 'debts' && pathParts.length > 2) {
            const debtId = pathParts[1];
            const field = pathParts[2];
            const debtIndex = newDebts.findIndex(d => d.id === debtId);
            if (debtIndex !== -1) {
              if (field === 'payments') {
                const paymentId = pathParts[3];
                if (!newDebts[debtIndex].payments) {
                  newDebts[debtIndex].payments = [];
                }
                // Since the original is an array, we need to push the new payment.
                // The `updates[updatePath]` holds the new payment object.
                const newPayment = updates[updatePath];
                
                // Ensure payments is treated as an array, converting from object if necessary.
                let paymentsArray = newDebts[debtIndex].payments;
                if (paymentsArray && !Array.isArray(paymentsArray)) {
                  paymentsArray = Object.values(paymentsArray);
                } else if (!paymentsArray) {
                  paymentsArray = [];
                }

                const existingPaymentIndex = paymentsArray.findIndex(p => p.id === newPayment.id);
                if (existingPaymentIndex === -1) {
                  paymentsArray.push(newPayment);
                } else {
                  paymentsArray[existingPaymentIndex] = newPayment;
                }
                newDebts[debtIndex].payments = paymentsArray;
              } else {
                (newDebts[debtIndex] as any)[field] = updates[updatePath];
              }
            }
          }
        });
        return newDebts;
      });

      // Also update the invoices local state to reflect payment changes
      setInvoicesData(prevInvoices => {
        const newInvoices = [...prevInvoices];
        Object.keys(updates).forEach(updatePath => {
          const pathParts = updatePath.split('/');
          if (pathParts[0] === 'invoices' && pathParts.length === 3) {
            const invoiceId = pathParts[1];
            const field = pathParts[2];
            const invoiceIndex = newInvoices.findIndex(inv => inv.id === invoiceId);
            if (invoiceIndex !== -1) {
              (newInvoices[invoiceIndex] as any)[field] = updates[updatePath];
            }
          }
        });
        return newInvoices;
      });

      // Log the activity
      try {
        if (!auth.currentUser) throw new Error("User not authenticated");
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            employeeId,
            employeeName,
            action: 'Ghi nhận thanh toán',
            details: `Thanh toán ${amount.toLocaleString('vi-VN')} VNĐ cho khách hàng có ID: ${customerGroupingKey}. Ghi chú: ${notes}`,
          }),
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

    } catch (error) {
      console.error("Error adding payment:", error);
      toast({ title: "Lỗi", description: "Không thể ghi nhận thanh toán.", variant: "destructive", duration: 2000 });
    }
  }, [currentUser, debtsData, invoicesData, toast]);
  const handleAddProductOption = useCallback(async (type: ProductOptionType, name: string) => { if (!name.trim()) { toast({ title: "Lỗi", description: "Tên tùy chọn không được để trống.", variant: "destructive", duration: 2000 }); return; } try { const sanitizedName = name.trim().replace(/[.#$[\]]/g, '_'); if (sanitizedName !== name.trim()) { toast({ title: "Cảnh báo", description: "Tên tùy chọn đã được chuẩn hóa để loại bỏ ký tự không hợp lệ.", variant: "default", duration: 2000 }); } if (!sanitizedName) { toast({ title: "Lỗi", description: "Tên tùy chọn sau khi chuẩn hóa không hợp lệ.", variant: "destructive", duration: 2000 }); return; } await set(ref(db, `productOptions/${type}/${sanitizedName}`), true); toast({ title: "Thành công", description: `Tùy chọn ${sanitizedName} đã được thêm.`, variant: "default", duration: 2000 }); } catch (error) { console.error(`Error adding product ${type} option:`, error); toast({ title: "Lỗi", description: `Không thể thêm tùy chọn ${type}.`, variant: "destructive", duration: 2000 }); } }, [toast]);
  const handleDeleteProductOption = useCallback(async (type: ProductOptionType, name: string) => { if (!hasFullAccessRights) { toast({ title: "Không có quyền", description: "Bạn không có quyền xóa tùy chọn sản phẩm.", variant: "destructive", duration: 2000 }); return; } try { await remove(ref(db, `productOptions/${type}/${name}`)); toast({ title: "Thành công", description: `Tùy chọn ${name} đã được xóa.`, variant: "default", duration: 2000 }); } catch (error) { console.error(`Error deleting product ${type} option:`, error); toast({ title: "Lỗi", description: `Không thể xóa tùy chọn ${type}.`, variant: "destructive", duration: 2000 }); } }, [toast, hasFullAccessRights]);
  
  const handleSaveShopInfo = useCallback(async (newInfo: ShopInfo) => {
    if (!hasFullAccessRights) {
        toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
        throw new Error("Permission denied");
    }
    try {
        await set(ref(db, 'shopInfo'), newInfo);
        toast({ title: "Thành công", description: "Thông tin cửa hàng đã được cập nhật.", duration: 2000 });
    } catch (error: any) {
        console.error("Error updating shop info:", error);
        throw error; 
    }
  }, [toast, hasFullAccessRights]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/login');
      toast({ title: "Đã đăng xuất", description: "Bạn đã đăng xuất thành công.", variant: "default", duration: 2000 });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Lỗi đăng xuất", description: "Không thể đăng xuất. Vui lòng thử lại.", variant: "destructive", duration: 2000 });
    }
  }, [signOut, router, toast]);

  const handleNameSet = useCallback(async (inputName: string) => { if (!currentUser) return; const isSuperAdminEmail = currentUser.email === ADMIN_EMAIL; const employeeName = isSuperAdminEmail ? ADMIN_NAME : inputName; try { await updateUserProfileName(employeeName); if (isSuperAdminEmail) { const updates: { [key: string]: any } = {}; updates[`employees/${currentUser.uid}`] = { name: ADMIN_NAME, email: ADMIN_EMAIL, position: 'ADMIN' }; updates[`userRoles/${currentUser.uid}`] = 'admin'; await update(ref(db), updates); } setIsSettingName(false); } catch (error) { console.error("Error in onNameSet:", error); toast({ title: "Lỗi", description: "Không thể cập nhật thông tin.", variant: "destructive", duration: 2000 }); } }, [currentUser, updateUserProfileName, toast]);

  const handleDeleteDebt = useCallback((debtId: string) => {
    const debt = debtsData.find(d => d.id === debtId);
    if (debt) {
      setDebtToDelete(debt);
      setIsConfirmingDebtDelete(true);
    } else {
      toast({ title: "Lỗi", description: "Không tìm thấy công nợ để xóa.", variant: "destructive", duration: 2000 });
    }
  }, [debtsData, toast]);

  const handleConfirmDeleteDebt = useCallback(async () => {
    if (!debtToDelete) return;
     if (!isCurrentUserAdmin) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền xóa công nợ.", variant: "destructive", duration: 2000 });
      setIsConfirmingDebtDelete(false);
      setDebtToDelete(null);
      return;
    }
    try {
      if (debtToDelete.invoiceId) {
        const invoiceRef = ref(db, `invoices/${debtToDelete.invoiceId}`);
        const invoiceSnapshot = await get(invoiceRef);
        if (invoiceSnapshot.exists()) {
          const invoiceData = invoiceSnapshot.val() as Invoice;
          if (invoiceData.debtAmount && invoiceData.debtAmount === ((debtToDelete as any).originalAmount || (debtToDelete as any).amount)) {
            await update(invoiceRef, { debtAmount: 0 });
          }
        }
      }
      await remove(ref(db, `debts/${debtToDelete.id}`));
      toast({ title: "Thành công", description: `Công nợ cho "${(debtToDelete.customerName || (debtToDelete as any).supplier)}" đã được xóa.`, variant: "default", duration: 2000 });
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast({ title: "Lỗi", description: "Không thể xóa công nợ. Vui lòng thử lại.", variant: "destructive", duration: 2000 });
    } finally {
      setIsConfirmingDebtDelete(false);
      setDebtToDelete(null);
    }
  }, [debtToDelete, isCurrentUserAdmin, toast]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, currentEmployeeId: string, currentEmployeeName: string) => {
    try {
        const orderToUpdate = ordersData.find(o => o.id === orderId);
        if (!orderToUpdate) {
            toast({ title: "Lỗi", description: "Không tìm thấy đơn hàng để cập nhật.", variant: "destructive", duration: 2000 });
            return;
        }

        const updates: Record<string, any> = {};

        if (newStatus === 'Hoàn thành') {
            if (orderToUpdate.orderStatus === 'Hoàn thành') {
                toast({ title: "Thông báo", description: "Đơn hàng đã được hoàn thành trước đó.", variant: "default", duration: 2000 });
                return;
            }

            // 1. Check inventory and prepare updates
            for (const item of orderToUpdate.items) {
                const productRef = ref(db, `inventory/${item.id}`);
                const productSnapshot = await get(productRef);
                if (productSnapshot.exists()) {
                    const currentQuantity = productSnapshot.val().quantity;
                    const newQuantity = currentQuantity - item.quantityInCart;
                        if (newQuantity < 0) {
                            toast({
                                title: "Lỗi tồn kho",
                                description: `Không đủ số lượng cho sản phẩm "${item.name}". Chỉ còn ${currentQuantity} trong kho.`,
                                variant: "destructive",
                                duration: 5000
                            });
                            return; // Stop the process
                        }
                        updates[`inventory/${item.id}/quantity`] = newQuantity;
                    } else {
                        toast({
                            title: "Lỗi sản phẩm",
                            description: `Sản phẩm "${item.name}" (ID: ${item.id}) không còn tồn tại trong kho.`,
                            variant: "destructive",
                            duration: 5000
                        });
                        return; // Stop the process
                    }
                }
                
                // 2. Create Invoice data
                // This new invoice will appear in the "Hóa đơn" tab for admins/employees
                // and in the "Lịch sử đặt hàng" tab for the customer.
                const newInvoiceRef = push(ref(db, 'invoices'));
                const newInvoiceId = newInvoiceRef.key;
                if (!newInvoiceId) throw new Error("Could not generate new invoice ID.");
                
                const invoiceData: Omit<Invoice, 'id'> = {
                    customerId: orderToUpdate.customerId,
                    customerName: orderToUpdate.customerName,
                    items: orderToUpdate.items,
                    total: orderToUpdate.totalAmount,
                    date: new Date().toISOString(),
                    paymentMethod: 'Chuyển khoản', // Defaulting since order doesn't specify payment yet
                    discount: orderToUpdate.overallDiscount || 0,
                    amountPaid: orderToUpdate.totalAmount, // Assuming fully paid on completion
                    debtAmount: 0,
                    employeeId: currentEmployeeId,
                    employeeName: currentEmployeeName,
                };
    
                // Add invoice creation to updates
                updates[`invoices/${newInvoiceId}`] = invoiceData;

            // 3. Mark order for deletion
            updates[`orders/${orderId}`] = null;
            
            // 4. Atomically execute all updates
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Đơn hàng #${orderId.substring(0,6)}... đã được hoàn tất và chuyển thành hóa đơn.`, duration: 2000 });

        } else if (newStatus === 'Đã hủy') {
            // This case is now handled by handleConfirmCancel, but if called directly, it deletes the order.
            updates[`orders/${orderId}`] = null;
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Đơn hàng #${orderId.substring(0,6)}... đã được xóa.`, duration: 2000 });
        }
        else { // Handle other statuses: 'Yêu cầu hủy'
            updates[`orders/${orderId}/orderStatus`] = newStatus;
            updates[`orders/${orderId}/updatedBy`] = currentEmployeeId;
            updates[`orders/${orderId}/updatedAt`] = new Date().toISOString();
            
            await update(ref(db), updates);
            toast({ title: "Thành công", description: `Trạng thái đơn hàng #${orderId.substring(0,6)}... đã được cập nhật thành "${newStatus}".`, duration: 2000 });
        }

    } catch (error) {
        console.error("Error updating order status:", error);
        toast({ title: "Lỗi", description: `Không thể cập nhật trạng thái đơn hàng: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive", duration: 2000 });
    }
  }, [toast, ordersData]);

  const handleConfirmCancel = useCallback(async (order: Order, reason: string) => {
    if (!currentUser) {
      toast({ title: "Lỗi", description: "Vui lòng đăng nhập để thực hiện thao tác này.", variant: "destructive", duration: 2000 });
      return;
    }

    try {
      if (hasFullAccessRights) {
        // Admin/Manager cancels the order directly, so delete it.
        await remove(ref(db, `orders/${order.id}`));
        toast({
          title: "Thành công",
          description: `Đơn hàng #${order.id.substring(0, 6)}... đã được xóa.`,
          duration: 2000
        });
      } else {
        // Customer requests cancellation, so update the status.
        const updates: Record<string, any> = {};
        updates[`orders/${order.id}/orderStatus`] = 'Yêu cầu hủy';
        updates[`orders/${order.id}/cancellationReason`] = reason;
        updates[`orders/${order.id}/updatedBy`] = currentUser.uid;
        updates[`orders/${order.id}/updatedAt`] = new Date().toISOString();
        await update(ref(db), updates);
        toast({
          title: "Thành công",
          description: `Đã gửi yêu cầu hủy cho đơn hàng #${order.id.substring(0, 6)}...`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Error processing order cancellation:", error);
      toast({ title: "Lỗi", description: `Không thể xử lý hủy đơn hàng: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive", duration: 2000 });
    }
  }, [currentUser, hasFullAccessRights, toast]);

  const handleToggleEmployeeRole = useCallback(async (employeeId: string, currentPosition: EmployeePosition) => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể thay đổi vai trò của tài khoản này.", variant: "destructive", duration: 2000 });
      return;
    }

    let newPosition: EmployeePosition;
    if (currentPosition === 'Nhân viên') {
      newPosition = 'Quản lý';
    } else if (currentPosition === 'Quản lý') {
      newPosition = 'Nhân viên';
    } else {
      toast({ title: "Lỗi", description: "Thao tác không hợp lệ cho vai trò hiện tại.", variant: "destructive", duration: 2000 });
      return;
    }

    try {
      await update(ref(db, `employees/${employeeId}`), { position: newPosition });
      toast({
        title: "Thành công",
        description: `Đã cập nhật vai trò của ${targetEmployee.name} thành ${newPosition}.`,
        variant: "default",
        duration: 2000
      });
    } catch (error) {
      console.error("Error toggling employee role:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật vai trò nhân viên.", variant: "destructive", duration: 2000 });
    }
  }, [currentUser, employeesData, toast]);

  const handleUpdateEmployeeInfo = useCallback(async (employeeId: string, data: { name: string; phone?: string; zaloName?: string; }) => {
    if (!isCurrentUserAdmin) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể chỉnh sửa thông tin của tài khoản này.", variant: "destructive", duration: 2000 });
      return;
    }

    try {
      const updates: Partial<Employee> = { name: data.name };
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.zaloName !== undefined) updates.zaloName = data.zaloName;

      await update(ref(db, `employees/${employeeId}`), updates);

      if (currentUser && employeeId === currentUser.uid && data.name !== currentUser.displayName) {
         await updateUserProfileName(data.name);
      }

      toast({ title: "Thành công", description: `Thông tin của ${data.name} đã được cập nhật.`, duration: 2000 });
    } catch (error) {
      console.error("Error updating employee info:", error);
      toast({ title: "Lỗi", description: "Không thể cập nhật thông tin nhân viên.", variant: "destructive", duration: 2000 });
    }
  }, [isCurrentUserAdmin, toast, employeesData, currentUser, updateUserProfileName]);

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    if (!isCurrentUserAdmin) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
      return;
    }
    const targetEmployee = employeesData.find(emp => emp.id === employeeId);
    if (!targetEmployee || targetEmployee.email === ADMIN_EMAIL) {
      toast({ title: "Lỗi", description: "Không thể xóa tài khoản này.", variant: "destructive", duration: 2000 });
      return;
    }

    try {
      const updates: Record<string, any> = {};
      updates[`employees/${employeeId}`] = null;
      updates[`userAccessRequests/${employeeId}`] = null;

      await update(ref(db), updates);
      toast({ title: "Thành công", description: `Nhân viên ${targetEmployee.name} đã được xóa.`, duration: 2000 });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({ title: "Lỗi", description: "Không thể xóa nhân viên. Vui lòng thử lại.", variant: "destructive", duration: 2000 });
    }
  }, [isCurrentUserAdmin, toast, employeesData]);

  const handleDisposeProductItems = useCallback(async (
    productId: string,
    quantityToDecrease: number,
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'images'>,
    employeeId: string,
    employeeName: string
  ) => {
    if (!hasFullAccessRights) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive", duration: 2000 });
      return;
    }
    try {
      const productRef = ref(db, `inventory/${productId}`);
      const productSnapshot = await get(productRef);
      if (productSnapshot.exists()) {
        const currentProduct = productSnapshot.val() as Product;
        const newQuantity = currentProduct.quantity - quantityToDecrease;
        if (newQuantity < 0) {
          toast({ title: "Lỗi", description: "Số lượng loại bỏ vượt quá tồn kho.", variant: "destructive", duration: 2000 });
          return;
        }
        await update(productRef, { quantity: newQuantity });


        const newDisposalLogRef = push(ref(db, 'disposalLog'));
        const logEntry: Omit<DisposalLogEntry, 'id'> = {
          productId,
          productName: productDetails.name,
          color: productDetails.color,
          quality: productDetails.quality,
          size: productDetails.size,
          unit: productDetails.unit,
          images: productDetails.images,
          quantityDisposed: quantityToDecrease,
          reason: reason || 'Không có lý do',
          disposalDate: new Date().toISOString(),
          employeeId,
          employeeName,
        };
        await set(newDisposalLogRef, logEntry);

        toast({ title: "Thành công", description: `Đã loại bỏ ${quantityToDecrease} ${currentProduct.unit} ${currentProduct.name}. Lý do: ${reason || 'Không có lý do'}. Kho và nhật ký đã cập nhật.`, variant: "default", duration: 2000 });

      } else {
        throw new Error(`Sản phẩm ID ${productId} không tồn tại để cập nhật số lượng.`);
      }
    } catch (error) {
      console.error("Error disposing product items:", error);
      toast({ title: "Lỗi", description: `Không thể loại bỏ sản phẩm: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive", duration: 2000 });
    }
  }, [toast, hasFullAccessRights]);

  const onAddToCartForCustomer = useCallback((product: Product, quantity: number, notes: string) => {
      if (product.quantity <= 0) {
          toast({ title: "Hết hàng", description: `Sản phẩm "${product.name}" đã hết hàng!`, variant: "destructive", duration: 2000 });
          return;
      }
      setCustomerCart(prevCart => {
          const existingItem = prevCart.find(cartItem => cartItem.id === product.id);
          if (existingItem) {
              const newQuantity = existingItem.quantityInCart + quantity;
              if (newQuantity <= product.quantity) {
                  return prevCart.map(cartItem =>
                      cartItem.id === product.id
                          ? { ...cartItem, quantityInCart: newQuantity, notes: notes || cartItem.notes }
                          : cartItem
                  );
              } else {
                   toast({ title: "Số lượng tối đa", description: `Không đủ số lượng "${product.name}" trong kho (Còn: ${product.quantity}).`, variant: "destructive", duration: 2000 });
                   return prevCart;
              }
          }
          return [...prevCart, { ...product, quantityInCart: quantity, itemDiscount: 0, notes }];
      });
      toast({
          title: "Đã thêm vào giỏ",
          description: `Đã thêm ${quantity} "${product.name}" vào giỏ hàng.`,
          variant: 'default',
          duration: 2000
      });
      // No longer need to set temporary animation state here.
  }, [toast]);

  const handleAddToCartFromStorefront = useCallback((product: Product) => {
    // This function adapts the more detailed onAddToCartForCustomer for the simpler storefront button.
    onAddToCartForCustomer(product, 1, '');
  }, [onAddToCartForCustomer]);

  const onUpdateCustomerCartQuantity = useCallback((itemId: string, newQuantityStr: string) => {
    if (newQuantityStr.trim() === '') {
      setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: 0 } : item));
      return;
    }
    
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity)) return; // Invalid text like 'abc'

    if (newQuantity <= 0) {
        setCustomerCart(prev => prev.filter(item => item.id !== itemId));
        return;
    }

    const stockItem = inventory.find(i => i.id === itemId);
    const stockQuantity = stockItem?.quantity ?? 0;

    if (newQuantity > stockQuantity) {
        toast({ title: "Số lượng không đủ", description: `Chỉ còn ${stockQuantity} sản phẩm trong kho.`, variant: "destructive", duration: 2000 });
        setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: stockQuantity } : item));
    } else {
        setCustomerCart(prev => prev.map(item => item.id === itemId ? { ...item, quantityInCart: newQuantity } : item));
    }
  }, [inventory, toast]);

  const onRemoveFromCustomerCart = useCallback((itemId: string) => {
      setCustomerCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleConfirmOrderFromCart = useCallback(async (discountAmount: number) => {
    if (customerCart.length === 0) {
        toast({ title: "Lỗi", description: "Giỏ hàng của bạn đang trống.", variant: "destructive", duration: 2000 });
        return;
    }
    for (const item of customerCart) {
        const stockItem = inventory.find(i => i.id === item.id);
        if (!stockItem || item.quantityInCart > stockItem.quantity) {
            toast({ title: "Lỗi tồn kho", description: `Sản phẩm "${item.name}" không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.`, variant: "destructive", duration: 2000 });
            return;
        }
    }

    if (!currentUser || !isCurrentUserCustomer) return;

    const customerData = currentUserCustomerData;
    if (!customerData) {
        toast({ title: "Lỗi", description: "Không tìm thấy thông tin khách hàng của bạn.", variant: "destructive", duration: 2000 });
        return;
    }

    const orderItems: OrderItem[] = customerCart.map(item => ({
        id: item.id,
        name: item.name,
        quality: item.quality,
        price: item.price,
        costPrice: item.costPrice,
        images: item.images,
        color: item.color,
        size: item.size,
        unit: item.unit,
        quantityInCart: item.quantityInCart,
        itemDiscount: 0,
        notes: item.notes,
    }));

    const subTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantityInCart), 0);
    const totalAmount = subTotal - discountAmount;

    const newOrderData: Omit<Order, 'id'> = {
        orderNumber: `DH-${Date.now().toString().slice(-8)}`,
        customerId: currentUser.uid,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerAddress: customerData.address || '',
        customerZaloName: customerData.zaloName || '',
        items: orderItems,
        subTotal: subTotal,
        shippingFee: 0,
        totalAmount: totalAmount,
        overallDiscount: discountAmount,
        paymentMethod: 'Chuyển khoản',
        orderStatus: 'Chờ xác nhận',
        orderDate: new Date().toISOString(),
    };
    
    try {
        const newOrderRef = push(ref(db, 'orders'));
        const newOrderId = newOrderRef.key;
        if (!newOrderId) {
            throw new Error("Không thể tạo ID cho đơn hàng mới.");
        }
        await set(newOrderRef, newOrderData);

        toast({
            title: "Đơn hàng đã được tạo thành công!",
            description: `Mã đơn hàng của bạn là: ${newOrderId}. Vui lòng sử dụng mã này khi thanh toán.`,
            duration: 10000, // Keep the toast open longer
        });
        setIsCartSheetOpen(false);
        setCustomerCart([]);
    } catch (error) {
        console.error("Error placing order:", error);
        toast({ title: "Lỗi", description: "Không thể đặt hàng. Vui lòng thử lại.", variant: "destructive", duration: 2000 });
    }
  }, [customerCart, inventory, currentUser, isCurrentUserCustomer, currentUserCustomerData, toast]);

  const handleOpenNoteEditor = useCallback((itemId: string) => {
    const item = customerCart.find(i => i.id === itemId);
    if (item) {
        setEditingNoteItemId(itemId);
        setItemNoteContent(item.notes || '');
        setIsNoteEditorOpen(true);
    }
  }, [customerCart]);

  const handleSaveItemNote = useCallback(() => {
    if (!editingNoteItemId) return;
    setCustomerCart(prevCart => 
        prevCart.map(item => 
            item.id === editingNoteItemId ? { ...item, notes: itemNoteContent.trim() } : item
        )
    );
    setIsNoteEditorOpen(false);
    setEditingNoteItemId(null);
    setItemNoteContent('');
  }, [editingNoteItemId, itemNoteContent]);

  const handleAddToStorefront = useCallback(async (productId: string) => {
    try {
        await set(ref(db, `storefrontProducts/${productId}`), true);
        toast({ title: "Thành công", description: "Sản phẩm đã được thêm vào gian hàng.", duration: 2000 });
    } catch (error) {
        toast({ title: "Lỗi", description: "Không thể thêm sản phẩm vào gian hàng.", variant: "destructive", duration: 2000 });
    }
  }, [toast]);

  const handleRemoveFromStorefront = useCallback(async (productId: string) => {
      try {
          await remove(ref(db, `storefrontProducts/${productId}`));
          toast({ title: "Thành công", description: "Sản phẩm đã được gỡ khỏi gian hàng.", duration: 2000 });
      } catch (error) {
          toast({ title: "Lỗi", description: "Không thể gỡ sản phẩm khỏi gian hàng.", variant: "destructive", duration: 2000 });
      }
  }, [toast]);


  useEffect(() => {
    if (isCurrentUserCustomer) {
      setActiveTab('Gian hàng');
    }
  }, [isCurrentUserCustomer]);

  useEffect(() => {
    const restrictedTabsForStaff: TabName[] = ['Nhân viên', 'Phân tích', 'Gian hàng', 'Đơn hàng'];
    if (currentUserEmployeeData?.position === 'Nhân viên' && restrictedTabsForStaff.includes(activeTab)) {
        setActiveTab('Bán hàng');
        toast({ title: "Thông báo", description: "Bạn không có quyền truy cập vào tab này.", variant: "default", duration: 2000 });
    }
  }, [activeTab, currentUserEmployeeData, toast]);

  const handleOpenOrderDialog = useCallback((productGroup: Product[]) => {
    setSelectedProductGroupForOrder(productGroup);
    setIsOrderDialogOpen(true);
  }, []);

  const handleDeleteDisposalEntry = useCallback(async (id: string) => {
    if (!hasFullAccessRights) {
      toast({ title: "Không có quyền", description: "Bạn không có quyền xóa mục loại bỏ.", variant: "destructive", duration: 2000 });
      return;
    }
    try {
      await remove(ref(db, `disposalLog/${id}`));
      toast({ title: "Thành công", description: "Mục loại bỏ đã được xóa.", duration: 2000 });
    } catch (error) {
      console.error("Error deleting disposal entry:", error);
      toast({ title: "Lỗi", description: "Không thể xóa mục loại bỏ.", variant: "destructive", duration: 2000 });
    }
  }, [hasFullAccessRights, toast]);

  const handleSaveProductDescription = useCallback(async (productId: string, description: string) => {
    if (!hasFullAccessRights) {
        toast({ title: "Không có quyền", description: "Bạn không có quyền cập nhật mô tả sản phẩm.", variant: "destructive" });
        throw new Error("Permission denied");
    }
    try {
        await update(ref(db, `inventory/${productId}`), { description });
    } catch (error) {
        console.error("Error updating product description:", error);
        toast({ title: "Lỗi", description: "Không thể cập nhật mô tả sản phẩm.", variant: "destructive" });
        throw error;
    }
}, [hasFullAccessRights, toast]);

  useEffect(() => {
    if (currentUserCustomerData && invoicesData.length > 0) {
      const totalSpent = invoicesData
        .filter(invoice => invoice.customerId === currentUserCustomerData.id)
        .reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
      
      const tier = getVipTier(totalSpent);

      if (currentUserCustomerData.tier !== tier) {
        setCurrentUserCustomerData(prevData => prevData ? { ...prevData, tier } : null);
      }
    }
  }, [invoicesData, currentUserCustomerData]);

  const handleEmployeePayment = useCallback(async (
    selectedCustomer: Customer | null,
    paymentMethod: string,
    amountPaid: string,
    tierDiscount: number
  ) => {
    const isGuest = selectedCustomer === null;
    const customerName = isGuest ? 'Khách lẻ' : selectedCustomer.name;

    const amountPaidNumber = parseFloat(amountPaid) * 1000;
    if (isNaN(amountPaidNumber)) { // Allow 0, but not invalid numbers
        toast({ title: "Lỗi", description: "Số tiền khách trả không hợp lệ.", variant: "destructive" });
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantityInCart) - (item.itemDiscount || 0), 0);

    const success = await handleCreateInvoice(
      customerName,
      cart,
      subtotal,
      paymentMethod,
      amountPaidNumber,
      isGuest,
      currentUser?.uid || '',
      currentUser?.displayName || '',
      tierDiscount
    );

    if (success) {
      setIsCartSheetOpen(false);
    }
  }, [cart, handleCreateInvoice, currentUser, toast]);

  const openPaymentDialog = useCallback((debt: Debt) => {
    setSelectedDebt(debt);
    setIsPaymentDialogOpen(true);
  }, []);

  const openCustomerDebtHistoryDialog = useCallback((customerId: string, customerName: string) => {
    setSelectedCustomerForHistory({ id: customerId, name: customerName });
    setIsCustomerDebtHistoryDialogOpen(true);
  }, []);


  // --- Conditional Rendering Logic ---
  if (authLoading) return <LoadingScreen message="Đang tải ứng dụng..." />;
  if (!currentUser) return <LoadingScreen message="Đang chuyển hướng đến trang đăng nhập..." />;
  if (isSettingName) return <SetNameDialog onNameSet={handleNameSet} />;
  
  if (isLoadingAccessRequest) {
      return <LoadingScreen message="Đang kiểm tra quyền truy cập..." />;
  }

  if (currentUserEmployeeData || isCurrentUserAdmin || isCurrentUserCustomer) {
    return (
      <SidebarProvider>
        <FleurManagerLayoutContent
          currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} inventory={inventory}
          customersData={customersData} enhancedCustomersData={enhancedCustomersData} ordersData={ordersData} invoicesData={invoicesData} debtsData={debtsData}
          employeesData={employeesData} disposalLogEntries={disposalLogEntries} shopInfo={shopInfo} isLoadingShopInfo={isLoadingShopInfo}
          authLoading={authLoading} isLoadingAccessRequest={isLoadingAccessRequest}
          cart={cart} customerCart={customerCart} productNameOptions={productNameOptions} colorOptions={colorOptions} productQualityOptions={productQualityOptions}
          sizeOptions={sizeOptions} unitOptions={unitOptions} storefrontProducts={storefrontProducts} storefrontProductIds={storefrontProductIds} invoiceFilter={invoiceFilter}
          orderFilter={orderFilter} analysisFilter={analysisFilter} isUserInfoDialogOpen={isUserInfoDialogOpen}
          setIsUserInfoDialogOpen={setIsUserInfoDialogOpen} isScreenLocked={isScreenLocked} setIsScreenLocked={setIsScreenLocked}
          isSettingsDialogOpen={isSettingsDialogOpen} setIsSettingsDialogOpen={setIsSettingsDialogOpen}
          overallFontSize={overallFontSize} setOverallFontSize={setOverallFontSize} numericDisplaySize={numericDisplaySize}
          setNumericDisplaySize={setNumericDisplaySize} isCurrentUserAdmin={isCurrentUserAdmin}
          currentUserEmployeeData={currentUserEmployeeData} isCurrentUserCustomer={isCurrentUserCustomer} hasFullAccessRights={hasFullAccessRights}
          filteredInvoicesForInvoiceTab={filteredInvoicesForInvoiceTab}
          filteredDebtsForDebtTab={filteredDebtsForDebtTab}
          filteredOrdersForOrderTab={filteredOrdersForOrderTab}
          filteredInvoicesForAnalysis={filteredInvoicesForAnalysis}
          filteredDisposalLogForAnalysis={filteredDisposalLogForAnalysis}
          productSalesSummaryData={productSalesSummaryData}
          identifiedSlowMovingProductsData={identifiedSlowMovingProductsData}
          customerInsightsData={customerInsightsData}
          salesByHourData={salesByHourData}
          handleCreateInvoice={handleCreateInvoice} handleAddProductOption={handleAddProductOption}
          handleDeleteProductOption={handleDeleteProductOption} handleImportProducts={handleImportProducts}
          handleProcessInvoiceCancellationOrReturn={handleProcessInvoiceCancellationOrReturn}
          handleAddPayment={handleAddPayment}
          openPaymentDialog={openPaymentDialog}
          openCustomerDebtHistoryDialog={openCustomerDebtHistoryDialog}
          handleAddCustomer={handleAddCustomer}
          handleUpdateCustomer={handleUpdateCustomer} handleDeleteCustomer={handleDeleteCustomer}
          handleDeleteDebt={handleDeleteDebt} handleSaveShopInfo={handleSaveShopInfo} handleSignOut={handleSignOut}
          signIn={signIn} onAddToCart={onAddToCart} onUpdateCartQuantity={onUpdateCartQuantity}
          onItemDiscountChange={onItemDiscountChange} onClearCart={onClearCart} onRemoveFromCart={onRemoveFromCart} onAddToCartForCustomer={onAddToCartForCustomer}
          handleInvoiceFilterChange={handleInvoiceFilterChange}
          handleOrderFilterChange={handleOrderFilterChange}
          handleAnalysisFilterChange={handleAnalysisFilterChange}
          handleUpdateOrderStatus={handleUpdateOrderStatus} handleToggleEmployeeRole={handleToggleEmployeeRole}
          handleUpdateEmployeeInfo={handleUpdateEmployeeInfo} handleDeleteEmployee={handleDeleteEmployee}
          handleDisposeProductItems={handleDisposeProductItems}
          openAddProductDialog={openAddProductDialog}
          openEditProductDialog={openEditProductDialog} handleDeleteProductFromAnywhere={handleDeleteProductFromAnywhere}
          handleUpdateProduct={handleUpdateProduct}
          handleAddToStorefront={handleAddToStorefront}
          handleRemoveFromStorefront={handleRemoveFromStorefront}
          handleDeleteDisposalEntry={handleDeleteDisposalEntry}
          setIsCartSheetOpen={setIsCartSheetOpen}
          onOpenNoteEditor={handleOpenNoteEditor}
          onSelectProductGroupForOrder={handleOpenOrderDialog}
          handleAddToCartFromStorefront={handleAddToCartFromStorefront}
          onConfirmCancel={handleConfirmCancel}
          isCartAnimating={isCartAnimating}
          salesTabRef={salesTabRef}
          handleSaveProductDescription={handleSaveProductDescription}
        />
        {/* <ProductOrderDialog
            isOpen={isOrderDialogOpen}
            onClose={() => setIsOrderDialogOpen(false)}
            productGroup={selectedProductGroupForOrder}
            onAddToCart={onAddToCartForCustomer}
        /> */}
        {isCurrentUserCustomer ? (
          <CustomerCartSheet
              isOpen={isCartSheetOpen}
              onOpenChange={setIsCartSheetOpen}
              cart={customerCart}
              customer={currentUserCustomerData}
              onUpdateQuantity={onUpdateCustomerCartQuantity}
              onRemoveItem={onRemoveFromCustomerCart}
              onPlaceOrder={handleConfirmOrderFromCart as any}
              inventory={inventory}
              invoices={invoicesData}
              onOpenNoteEditor={handleOpenNoteEditor}
          />
        ) : (
          <EmployeeCartSheet
            isOpen={isCartSheetOpen}
            onOpenChange={setIsCartSheetOpen}
            cart={cart}
            inventory={inventory}
            customers={enhancedCustomersData}
            invoices={invoicesData}
            numericDisplaySize={numericDisplaySize}
            subtotalAfterItemDiscounts={cart.reduce((sum, item) => sum + (item.price * item.quantityInCart) - (item.itemDiscount || 0), 0)}
            onUpdateCartQuantity={onUpdateCartQuantity}
            onItemDiscountChange={onItemDiscountChange}
            onPayment={handleEmployeePayment}
            areAllItemDiscountsValid={cart.every(item => {
              const itemOriginalTotal = item.price * item.quantityInCart;
              const discount = item.itemDiscount || 0;
              return discount >= 0 && discount <= itemOriginalTotal;
            })}
          />
        )}
        <Dialog open={isNoteEditorOpen} onOpenChange={setIsNoteEditorOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm ghi chú cho sản phẩm</DialogTitle>
              <DialogDescription>
                  Thêm ghi chú riêng cho sản phẩm này. Ghi chú sẽ được gửi kèm trong đơn hàng.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={itemNoteContent} 
                onChange={(e) => setItemNoteContent(e.target.value)}
                placeholder="Ví dụ: Cắm hoa cao, gói giấy màu hồng..."
                className="min-h-[100px]"
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNoteEditorOpen(false)}>Hủy</Button>
                <Button onClick={handleSaveItemNote} className="bg-primary text-primary-foreground">Lưu ghi chú</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProductDialogs
          isProductFormOpen={isProductFormOpen}
          handleCloseProductFormDialog={handleCloseProductFormDialog}
          handleProductFormSubmit={handleProductFormSubmit}
          currentEditingProduct={currentEditingProduct}
          productNameOptions={productNameOptions}
          colorOptions={colorOptions}
          productQualityOptions={productQualityOptions}
          sizeOptions={sizeOptions}
          unitOptions={unitOptions}
          isProductFormEditMode={isProductFormEditMode}
          defaultProductFormData={defaultProductFormData}
          isConfirmingProductDelete={isConfirmingProductDelete}
          setIsConfirmingProductDelete={setIsConfirmingProductDelete}
          confirmDeleteProduct={confirmDeleteProduct}
          inventory={inventory}
        />
        <DebtDialogs
          isPaymentDialogOpen={isPaymentDialogOpen}
          setIsPaymentDialogOpen={setIsPaymentDialogOpen}
          selectedDebt={selectedDebt}
          currentUser={currentUser}
          handleAddPayment={handleAddPayment}
          isConfirmingDebtDelete={isConfirmingDebtDelete}
          setIsConfirmingDebtDelete={setIsConfirmingDebtDelete}
          debtToDelete={debtToDelete}
          handleConfirmDeleteDebt={handleConfirmDeleteDebt}
        />
        
        <CustomerDebtHistoryDialog
          isOpen={isCustomerDebtHistoryDialogOpen}
          onOpenChange={setIsCustomerDebtHistoryDialogOpen}
          customerId={selectedCustomerForHistory?.id || ''}
          customerName={selectedCustomerForHistory?.name || ''}
        />
      </SidebarProvider>
    );
  }

  if (userAccessRequest) {
    const isRejected = 'status' in userAccessRequest && userAccessRequest.status === 'rejected';
     if (isRejected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <UserX className="w-16 h-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-foreground">Yêu cầu đã bị từ chối</h1>
                <p className="text-muted-foreground">
                    Yêu cầu đăng ký của bạn đã bị từ chối.
                    {userAccessRequest.rejectionReason && ` Lý do: ${userAccessRequest.rejectionReason}.`}
                </p>
                <p className="text-muted-foreground">Vui lòng liên hệ quản trị viên hoặc đăng ký lại với thông tin chính xác.</p>
                <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  Đăng xuất và Đăng ký lại
                </Button>
            </div>
        );
    }
    // Otherwise, assume pending
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <HelpCircle className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Yêu cầu đang chờ duyệt</h1>
        <p className="text-muted-foreground">Yêu cầu đăng ký của bạn đã được gửi.</p>
        <p className="text-muted-foreground">Vui lòng chờ quản trị viên phê duyệt. Bạn có thể cần phải đăng nhập lại sau khi yêu cầu được duyệt.</p>
        <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Đăng xuất</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
        <UserX className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Không có quyền truy cập</h1>
        <p className="text-muted-foreground">
            Tài khoản của bạn không có quyền truy cập vào ứng dụng này.
        </p>
        <p className="text-muted-foreground">Vui lòng đăng ký tài khoản từ trang đăng nhập hoặc liên hệ quản trị viên.</p>
        <Button onClick={handleSignOut} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Về trang đăng nhập</Button>
    </div>
);
}
