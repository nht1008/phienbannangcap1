"use client";

import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SlowMovingFilterProps {
  dateRange: DateRange | undefined;
  onDateChange: (dateRange: DateRange | undefined) => void;
  applyNoSalesFilter: boolean;
  onApplyNoSalesFilterChange: (checked: boolean) => void;
  applySalesLessThanFilter: boolean;
  onApplySalesLessThanFilterChange: (checked: boolean) => void;
  salesLessThanUnits: number;
  onSalesLessThanUnitsChange: (value: number) => void;
}

export const SlowMovingFilter = ({
  dateRange,
  onDateChange,
  applyNoSalesFilter,
  onApplyNoSalesFilterChange,
  applySalesLessThanFilter,
  onApplySalesLessThanFilterChange,
  salesLessThanUnits,
  onSalesLessThanUnitsChange,
}: SlowMovingFilterProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ lọc Hàng Bán Chậm</CardTitle>
        <CardDescription>Sử dụng bộ lọc dưới đây để xác định các sản phẩm bán chậm trong một khoảng thời gian cụ thể.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Khoảng thời gian</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/y", { locale: vi })} - {format(dateRange.to, "dd/MM/y", { locale: vi })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/y", { locale: vi })
                    )
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateChange}
                  numberOfMonths={2}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-sm font-medium">Tiêu chí lọc</Label>
            <div className="space-y-2 mt-1">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="applyNoSalesFilter" checked={applyNoSalesFilter} onChange={(e) => onApplyNoSalesFilterChange(e.target.checked)} className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"/>
                <Label htmlFor="applyNoSalesFilter" className="text-sm font-medium">Sản phẩm không có doanh số</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="applySalesLessThanFilter" checked={applySalesLessThanFilter} onChange={(e) => onApplySalesLessThanFilterChange(e.target.checked)} className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"/>
                <Label htmlFor="applySalesLessThanFilter" className="text-sm font-medium mr-2">Doanh số ít hơn</Label>
                <Input
                  type="number"
                  value={salesLessThanUnits}
                  onChange={(e) => onSalesLessThanUnitsChange(Number(e.target.value))}
                  className="w-20 h-8 bg-card"
                  disabled={!applySalesLessThanFilter}
                />
                <Label htmlFor="applySalesLessThanFilter" className="text-sm font-medium">đơn vị</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};