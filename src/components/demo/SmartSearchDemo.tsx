"use client";

import React, { useState } from 'react';
import { SmartSearchBar, SearchHighlight } from '@/components/shared/SmartSearchBar';
import { useDebtSearch, useCustomerSearch, useInvoiceSearch } from '@/hooks/use-smart-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data for demo
const sampleDebts = [
  { id: '1', customerName: 'Nguyễn Văn An', status: 'Còn nợ', remainingAmount: 500000, date: '2024-01-15', originalAmount: 1000000, amountPaid: 500000 },
  { id: '2', customerName: 'Trần Thị Bình', status: 'Đã thanh toán', remainingAmount: 0, date: '2024-02-20', originalAmount: 750000, amountPaid: 750000 },
  { id: '3', customerName: 'Lê Hoàng Cường', status: 'Quá hạn', remainingAmount: 1200000, date: '2023-12-10', originalAmount: 1200000, amountPaid: 0 }
];

const sampleCustomers = [
  { id: '1', name: 'Nguyễn Văn An', phone: '0901234567', email: 'an@email.com', address: 'Hà Nội', tier: 'Vàng' },
  { id: '2', name: 'Trần Thị Bình', phone: '0912345678', email: 'binh@email.com', address: 'Hồ Chí Minh', tier: 'Bạc' },
  { id: '3', name: 'Lê Hoàng Cường', phone: '0923456789', email: 'cuong@email.com', address: 'Đà Nẵng', tier: 'Đồng' }
];

const sampleInvoices = [
  { id: 'HD001', customerName: 'Nguyễn Văn An', total: 1500000, date: '2024-07-10', paymentMethod: 'Tiền mặt', employeeName: 'Admin' },
  { id: 'HD002', customerName: 'Trần Thị Bình', total: 2000000, date: '2024-07-11', paymentMethod: 'Chuyển khoản', employeeName: 'Admin' },
  { id: 'HD003', customerName: 'Lê Hoàng Cường', total: 750000, date: '2024-07-12', paymentMethod: 'Thẻ', employeeName: 'Admin' }
];

function DebtSearchDemo() {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useDebtSearch(sampleDebts);

  const suggestions = ['Nguyễn Văn An', 'Còn nợ', 'Đã thanh toán'];

  return (
    <div className="space-y-4">
      <SmartSearchBar
        placeholder="Tìm kiếm công nợ theo tên khách hàng, trạng thái..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        isSearching={isSearching}
        totalResults={totalResults}
        suggestions={suggestions}
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Còn lại</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResults.map((result, index) => (
            <TableRow key={result.item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.customerName} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.status} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>{result.item.remainingAmount.toLocaleString('vi-VN')} VNĐ</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CustomerSearchDemo() {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useCustomerSearch(sampleCustomers);

  const suggestions = ['Nguyễn Văn An', 'Hà Nội', 'Vàng'];

  return (
    <div className="space-y-4">
      <SmartSearchBar
        placeholder="Tìm kiếm khách hàng theo tên, SĐT, email..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        isSearching={isSearching}
        totalResults={totalResults}
        suggestions={suggestions}
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STT</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Địa chỉ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResults.map((result, index) => (
            <TableRow key={result.item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.name} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.phone} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.email} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.address} 
                  searchQuery={searchQuery}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InvoiceSearchDemo() {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredResults,
    isSearching,
    totalResults
  } = useInvoiceSearch(sampleInvoices);

  const suggestions = ['Nguyễn Văn An', 'Tiền mặt', 'HD001'];

  return (
    <div className="space-y-4">
      <SmartSearchBar
        placeholder="Tìm kiếm hóa đơn theo mã, khách hàng, nhân viên..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={clearSearch}
        isSearching={isSearching}
        totalResults={totalResults}
        suggestions={suggestions}
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã HĐ</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead>Nhân viên</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResults.map((result, index) => (
            <TableRow key={result.item.id}>
              <TableCell>
                <SearchHighlight 
                  text={result.item.id} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.customerName} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>{result.item.total.toLocaleString('vi-VN')} VNĐ</TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.paymentMethod} 
                  searchQuery={searchQuery}
                />
              </TableCell>
              <TableCell>
                <SearchHighlight 
                  text={result.item.employeeName} 
                  searchQuery={searchQuery}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SmartSearchDemo() {
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          🔍 Demo Tìm kiếm Thông minh
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Thử nghiệm tính năng tìm kiếm cho Công nợ, Khách hàng và Hóa đơn
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="debt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="debt">Công nợ</TabsTrigger>
            <TabsTrigger value="customer">Khách hàng</TabsTrigger>
            <TabsTrigger value="invoice">Hóa đơn</TabsTrigger>
          </TabsList>
          
          <TabsContent value="debt" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Tìm kiếm Công nợ</h3>
            <DebtSearchDemo />
          </TabsContent>
          
          <TabsContent value="customer" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Tìm kiếm Khách hàng</h3>
            <CustomerSearchDemo />
          </TabsContent>
          
          <TabsContent value="invoice" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Tìm kiếm Hóa đơn</h3>
            <InvoiceSearchDemo />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">💡 Hướng dẫn sử dụng:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Gõ tên khách hàng, trạng thái, hoặc bất kỳ thông tin nào để tìm kiếm</li>
            <li>• Tìm kiếm hỗ trợ tiếng Việt có dấu và không dấu</li>
            <li>• Click vào thanh tìm kiếm để xem gợi ý</li>
            <li>• Từ khóa tìm được sẽ được làm nổi bật màu vàng</li>
            <li>• Thử tìm kiếm mờ: gõ "Nguyen" thay vì "Nguyễn"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
