"use client";

import React, { useMemo, useState } from 'react';
import type { Debt, DebtStatus } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
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
  onOpenHistoryDialog: (debt: Debt) => void;
  currentUser: User | null;
}

export function DebtTab({
  debts,
  onOpenPaymentDialog,
  onOpenHistoryDialog,
  currentUser
}: DebtTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Use smart search hook
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useDebtSearch(debts);

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

  // Generate suggestions based on existing data
  const suggestions = useMemo(() => {
    const customerNames = [...new Set(debts.map(debt => debt.customerName))];
    const statuses = [...new Set(debts.map(debt => debt.status))];
    return [...customerNames.slice(0, 3), ...statuses];
  }, [debts]);

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
          Công nợ Khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {/* Smart Search Bar */}
        <div className="mb-4">
          <SmartSearchBar
            placeholder="Tìm kiếm công nợ theo tên khách hàng, trạng thái, số tiền..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={clearSearch}
            isSearching={isSearching}
            totalResults={totalResults}
            suggestions={suggestions}
            showFilters={true}
            filters={filterContent}
          />
        </div>

        <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-md text-[hsl(var(--destructive))]">
          <p className="font-bold">
            Tổng công nợ {searchQuery || statusFilter !== 'all' ? 'đã lọc' : 'khách hàng'}: {totalUnpaid.toLocaleString('vi-VN')} VNĐ
            {(searchQuery || statusFilter !== 'all') && (
              <span className="text-sm font-normal ml-2">
                ({filteredDebts.length}/{debts.length} kết quả)
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
                    {searchQuery || statusFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Không có công nợ'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                      : 'Hiện tại không có khách hàng nào còn nợ.'
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
                  <TableHead>Ngày nợ</TableHead>
                  <TableHead className="text-right">Tiền nợ</TableHead>
                  <TableHead className="text-right">Đã trả</TableHead>
                  <TableHead className="text-right">Còn lại</TableHead>
                  <TableHead className="text-center">Chức năng</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.map((debt, index) => (
                  <TableRow key={debt.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <SearchHighlight 
                        text={debt.customerName} 
                        searchQuery={searchQuery}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(debt.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">{debt.originalAmount.toLocaleString('vi-VN')} VNĐ</TableCell>
                    <TableCell className="text-right">{debt.amountPaid.toLocaleString('vi-VN')} VNĐ</TableCell>
                    <TableCell className="text-right font-bold">{debt.remainingAmount.toLocaleString('vi-VN')} VNĐ</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenPaymentDialog(debt)}
                        disabled={debt.status === 'Đã thanh toán'}
                      >
                        Thanh toán
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenHistoryDialog(debt)}
                      >
                        Lịch sử
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-semibold",
                        debt.status === 'Đã thanh toán' && 'bg-success/20 text-success',
                        debt.status === 'Còn nợ' && 'bg-destructive/20 text-destructive',
                        debt.status === 'Quá hạn' && 'bg-warning/20 text-warning-foreground'
                      )}>
                        <SearchHighlight 
                          text={debt.status} 
                          searchQuery={searchQuery}
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
