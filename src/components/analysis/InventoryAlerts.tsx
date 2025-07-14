"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

// We'll define a more specific type for this later if needed
interface LowStockProduct extends Product {
  forecastedEmptyDate?: string; // Optional advanced feature
}

interface InventoryAlertsProps {
  lowStockProducts: LowStockProduct[];
}

export const InventoryAlerts = ({ lowStockProducts }: InventoryAlertsProps) => {
  return (
    <Card className="bg-yellow-500 text-white">
      <CardHeader>
        <CardTitle className="text-white">Cảnh báo Tồn kho</CardTitle>
        <CardDescription className="text-white/90">Các sản phẩm có số lượng tồn kho thấp cần chú ý.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Tồn kho hiện tại</TableHead>
                <TableHead className="text-right">Ngưỡng cảnh báo</TableHead>
                <TableHead>Trạng thái</TableHead>
                {/* <TableHead>Dự báo hết hàng</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Không có sản phẩm nào sắp hết hàng.
                  </TableCell>
                </TableRow>
              ) : (
                lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Image
                        src={product.images?.[0] || `https://placehold.co/40x40.png`}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-md object-cover aspect-square"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40.png'; }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || 'N/A'}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{product.lowStockThreshold || 10}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Sắp hết hàng</Badge>
                    </TableCell>
                    {/* <TableCell>{product.forecastedEmptyDate || 'N/A'}</TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};