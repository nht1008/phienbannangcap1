"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type ProductPerformance from '@/types/ProductPerformance';

interface SlowSellingProductsTableProps {
  data: ProductPerformance[];
}

export const SlowSellingProductsTable = ({ data }: SlowSellingProductsTableProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Sản phẩm Bán chậm</CardTitle>
          <CardDescription>Các sản phẩm bán chậm nhất trong khoảng thời gian đã chọn.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-10">Không có dữ liệu sản phẩm để hiển thị.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sản phẩm Bán chậm</CardTitle>
        <CardDescription>Các sản phẩm bán chậm nhất trong khoảng thời gian đã chọn.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Thuộc tính</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Số lượng bán</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Tồn kho</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Doanh thu</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow key={product.key} className={index < 3 ? "bg-red-100/50" : ""}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {[
                      product.color,
                      product.size,
                      product.quality,
                      product.unit,
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.soldInPeriod}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.currentStock}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.revenueInPeriod.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.profitInPeriod.toLocaleString('vi-VN')} VNĐ</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};