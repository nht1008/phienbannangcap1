"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface ProductPerformance {
  name: string;
  sold: number;
  revenue: number;
  profit: number;
  key: string;
  color?: string;
  size?: string;
  quality?: string;
  unit?: string;
}

interface TopSellingProductsTableProps {
  data: ProductPerformance[];
}

export const TopSellingProductsTable = ({ data }: TopSellingProductsTableProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Sản phẩm Bán chạy</CardTitle>
          <CardDescription>Các sản phẩm bán chạy nhất trong khoảng thời gian đã chọn.</CardDescription>
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
        <CardTitle>Top Sản phẩm Bán chạy</CardTitle>
        <CardDescription>Các sản phẩm bán chạy nhất trong khoảng thời gian đã chọn.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Thuộc tính</TableHead>
                <TableHead className="text-right font-semibold text-primary">Số lượng bán</TableHead>
                <TableHead className="text-right font-semibold text-primary">Doanh thu</TableHead>
                <TableHead className="text-right font-semibold text-primary">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow key={product.key} className={index < 3 ? "bg-green-100/50" : ""}>
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
                  <TableCell className="text-right font-bold text-green-600">{product.sold}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{product.revenue.toLocaleString('vi-VN')} VNĐ</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{product.profit.toLocaleString('vi-VN')} VNĐ</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};