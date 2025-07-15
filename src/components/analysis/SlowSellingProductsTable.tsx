"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle } from 'lucide-react';

interface EnhancedProductPerformance {
  key: string;
  id: string;
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  images: string[];
  currentStock: number;
  soldInPeriod: number;
  revenueInPeriod: number;
  profitInPeriod: number;
  // Thêm các trường cho disposal info
  quantityDisposed?: number;
  lastDisposalDate?: string;
  disposalReasons?: string[];
}

interface SlowSellingProductsTableProps {
  data: EnhancedProductPerformance[];
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
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Top Sản phẩm Bán chậm
        </CardTitle>
        <CardDescription>Các sản phẩm bán chậm nhất trong khoảng thời gian đã chọn (bao gồm cả sản phẩm đã loại bỏ).</CardDescription>
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
                <TableHead className="text-right font-semibold text-orange-600">Đã loại bỏ</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Doanh thu</TableHead>
                <TableHead className="text-right font-semibold text-destructive">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow key={product.key} className={index < 3 ? "bg-red-100/50" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      {product.quantityDisposed && product.quantityDisposed > 0 && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          Có loại bỏ
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>
                        {[
                          product.color,
                          product.size,
                          product.quality,
                          product.unit,
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </div>
                      {product.disposalReasons && product.disposalReasons.length > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          Lý do loại bỏ: {product.disposalReasons.join(", ")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.soldInPeriod}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{product.currentStock}</TableCell>
                  <TableCell className="text-right font-bold text-orange-600">
                    {product.quantityDisposed && product.quantityDisposed > 0 ? (
                      <div className="flex flex-col items-end">
                        <span>{product.quantityDisposed}</span>
                        {product.lastDisposalDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(product.lastDisposalDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
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