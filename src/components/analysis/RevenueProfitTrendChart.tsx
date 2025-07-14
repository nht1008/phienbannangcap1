"use client";

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-background border border-border rounded-lg shadow-lg">
        <p className="label font-bold text-foreground">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString('vi-VN')} VNĐ`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface TrendData {
  date: string;
  revenue: number;
  profit: number;
}

interface RevenueProfitTrendChartProps {
  data: TrendData[];
  viewMode: 'daily' | 'monthly' | 'yearly';
  onViewModeChange: (mode: 'daily' | 'monthly' | 'yearly') => void;
}

export const RevenueProfitTrendChart = ({ data, viewMode, onViewModeChange }: RevenueProfitTrendChartProps) => {
  const [showRevenue, setShowRevenue] = useState(true);
  const [showProfit, setShowProfit] = useState(true);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Xu hướng Doanh thu và Lợi nhuận</CardTitle>
          <CardDescription>
            Biểu đồ thể hiện doanh thu và lợi nhuận trong khoảng thời gian đã chọn.
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value: 'daily' | 'monthly' | 'yearly') => {
            if (value) onViewModeChange(value);
          }}
          className="mt-4 sm:mt-0"
        >
          <ToggleGroupItem value="daily" aria-label="Toggle daily view">
            Theo Ngày
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Toggle monthly view">
            Theo Tháng
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" aria-label="Toggle yearly view">
            Theo Năm
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend />
              {showRevenue && <Bar dataKey="revenue" name="Doanh thu" fill="#1E3A8A" radius={[4, 4, 0, 0]} cursor="pointer" />}
              {showProfit && <Bar dataKey="profit" name="Lợi nhuận" fill="#15803D" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-6 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="revenue-toggle" checked={showRevenue} onCheckedChange={(checked: boolean | 'indeterminate') => setShowRevenue(!!checked)} />
            <Label htmlFor="revenue-toggle" className="font-medium" style={{ color: '#1E3A8A' }}>Doanh thu</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="profit-toggle" checked={showProfit} onCheckedChange={(checked: boolean | 'indeterminate') => setShowProfit(!!checked)} />
            <Label htmlFor="profit-toggle" className="font-medium" style={{ color: '#15803D' }}>Lợi nhuận</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};