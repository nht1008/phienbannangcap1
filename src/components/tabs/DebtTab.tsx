"use client";

import React, { useMemo, useState } from 'react';
import type { Debt, DebtStatus } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatCurrencyForUser } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoDebtIllustration } from '@/components/illustrations/NoDebtIllustration';
import { DebtIcon } from '@/components/icons/DebtIcon';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar';
import { useDebtSearch } from '@/hooks/use-smart-search';

interface DebtTabProps {
  debts: Debt[];
  onOpenPaymentDialog: (debt: Debt) => void;
  openCustomerDebtHistoryDialog: (customerId: string, customerName: string) => void;
  currentUser: User | null;
  isCurrentUserCustomer: boolean;
}

export function DebtTab({
  debts,
  onOpenPaymentDialog,
  openCustomerDebtHistoryDialog,
  currentUser,
  isCurrentUserCustomer
}: DebtTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filter debts based on user type
  const availableDebts = useMemo(() => {
    if (isCurrentUserCustomer && currentUser) {
      // For customers, only show their own debts
      return debts.filter(debt => debt.customerId === currentUser.uid);
    }
    // For staff/managers, show all debts
    return debts;
  }, [debts, isCurrentUserCustomer, currentUser]);
  
  // Use smart search hook with filtered debts
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useDebtSearch(availableDebts);

  // Apply status filter to search results
  const filteredDebts = useMemo(() => {
    let results = filteredResults.map(result => result.item);
    
    if (statusFilter !== 'all') {
      results = results.filter(debt => debt.status === statusFilter);
    }
    
    return results;
  }, [filteredResults, statusFilter]);

  const totalUnpaid = useMemo(() =>
    filteredDebts.reduce((sum, d) => sum + d.remainingAmount, 0),
    [filteredDebts]
  );

  // Generate suggestions based on available data
  const suggestions = useMemo(() => {
    const customerNames = [...new Set(availableDebts.map(debt => debt.customerName))];
    const statuses = [...new Set(availableDebts.map(debt => debt.status))];
    return [...customerNames.slice(0, 3), ...statuses];
  }, [availableDebts]);

  const filterContent = (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Trạng thái</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Còn nợ">Còn nợ</SelectItem>
            <SelectItem value="Đã thanh toán">Đã thanh toán</SelectItem>
            <SelectItem value="Quá hạn">Quá hạn</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-4xl font-bold flex items-center">
          <DebtIcon className="mr-3 h-10 w-10" />
          {isCurrentUserCustomer ? 'Công nợ của tôi' : 'Công nợ & Lịch sử Khách hàng'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {/* Smart Search Bar */}
        <div className="mb-4">
          <SmartSearchBar
            placeholder={isCurrentUserCustomer ? "Tìm kiếm công nợ của tôi theo trạng thái, số tiền..." : "Tìm kiếm khách hàng theo tên, trạng thái, số tiền..."}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={clearSearch}
            isSearching={isSearching}
            totalResults={totalResults}
            suggestions={[]}
            showFilters={true}
            filters={filterContent}
          />
        </div>

        <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-md text-[hsl(var(--destructive))]">
          <p className="font-bold">
            {isCurrentUserCustomer ? 'Tổng nợ còn lại của tôi' : `Tổng nợ còn lại ${searchQuery || statusFilter !== 'all' ? 'đã lọc' : 'của tất cả khách hàng'}`}: {formatCurrencyForUser(totalUnpaid, isCurrentUserCustomer)}
            {!isCurrentUserCustomer && (searchQuery || statusFilter !== 'all') && (
              <span className="text-sm font-normal ml-2">
                ({filteredDebts.length}/{debts.length} khách hàng)
              </span>
            )}
          </p>
        </div>
        <div className="flex-grow overflow-hidden">
          {filteredDebts.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <NoDebtIllustration />
                  <h3 className="text-xl font-semibold">
                    {searchQuery || statusFilter !== 'all' ? 'Không tìm thấy khách hàng' : (isCurrentUserCustomer ? 'Bạn không có công nợ nào' : 'Không có khách hàng nào')}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                      : (isCurrentUserCustomer ? 'Bạn chưa có giao dịch công nợ nào được ghi nhận.' : 'Hiện tại chưa có giao dịch công nợ nào được ghi nhận.')
                    }
                  </p>
                </div>
              </div>
          ) : (
          <ScrollArea className="h-full"> 
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Tiền nợ</TableHead>
                    <TableHead className="text-right text-green-600">Đã trả</TableHead>
                    <TableHead className="text-right text-red-600">Còn nợ</TableHead>
                  <TableHead className="text-center">Chức năng</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.map((debt, index) => {
                  const debtDate = new Date(debt.date);
                  return (
                  <TableRow key={debt.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <SearchHighlight 
                        text={debt.customerName} 
                        searchQuery={searchQuery}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{debtDate.toLocaleDateString('vi-VN')}</div>
                        <div className="text-muted-foreground">{debtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="bg-red-600 text-white px-2 py-1 rounded">
                        {formatCurrencyForUser(debt.originalAmount, isCurrentUserCustomer)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="bg-green-600 text-white px-2 py-1 rounded">
                        {formatCurrencyForUser(debt.amountPaid, isCurrentUserCustomer)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <span className="bg-red-600 text-white px-2 py-1 rounded">
                        {formatCurrencyForUser(debt.remainingAmount, isCurrentUserCustomer)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenPaymentDialog(debt)}
                        disabled={debt.status === 'Đã thanh toán'}
                      >
                        Trả nợ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // For customers, always show their own history regardless of which debt they click
                          const customerIdToShow = isCurrentUserCustomer && currentUser 
                            ? currentUser.uid 
                            : (debt.customerId || debt.customerName);
                          const customerNameToShow = isCurrentUserCustomer && currentUser
                            ? debt.customerName // Use the customer name from the debt
                            : debt.customerName;
                          openCustomerDebtHistoryDialog(customerIdToShow, customerNameToShow);
                        }}
                        title="Xem toàn bộ lịch sử công nợ của khách hàng"
                      >
                        Lịch sử
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${debt.status === 'Đã thanh toán' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                      >
                        <SearchHighlight 
                          text={debt.status} 
                          searchQuery={searchQuery}
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
