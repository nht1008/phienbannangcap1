"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from './KpiCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CustomerInsight } from '@/app/page'; // Assuming this type is defined in page.tsx
import { FileText } from 'lucide-react';

interface CustomerAnalysisReportProps {
  customerInsights: CustomerInsight;
}

export const CustomerAnalysisReport = ({ customerInsights }: CustomerAnalysisReportProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard
          title="Khách hàng mới"
          value={customerInsights.newVsReturning.new}
          description="Khách hàng có đơn hàng đầu tiên trong kỳ"
          icon={<FileText className="h-6 w-6" />}
          colorClassName="bg-indigo-600 text-white"
        />
        <KpiCard
          title="Tổng số khách hàng"
          value={customerInsights.newVsReturning.new + customerInsights.newVsReturning.returning}
          description="Tổng số khách hàng có giao dịch trong kỳ"
          icon={<FileText className="h-6 w-6" />}
          colorClassName="bg-teal-600 text-white"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Khách hàng chi tiêu nhiều nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng</TableHead>
                    <TableHead>Tên Khách hàng</TableHead>
                    <TableHead className="text-right">Số đơn</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInsights.topCustomersByRevenue.map((customer, index) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                      <TableCell className="text-right">{customer.totalRevenue.toLocaleString('vi-VN')} VNĐ</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Khách hàng trung thành nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng</TableHead>
                    <TableHead>Tên Khách hàng</TableHead>
                    <TableHead className="text-right">Số đơn</TableHead>
                    <TableHead>Ngày mua cuối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This will need a new data source */}
                  {customerInsights.topCustomersByInvoiceCount.map((customer, index) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-right">{customer.invoiceCount}</TableCell>
                      <TableCell>{new Date(customer.lastPurchaseDate).toLocaleDateString('vi-VN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};