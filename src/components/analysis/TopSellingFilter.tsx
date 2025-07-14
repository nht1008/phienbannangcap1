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

interface TopSellingFilterProps {
  dateRange: DateRange | undefined;
  onDateChange: (dateRange: DateRange | undefined) => void;
  topN: number;
  onTopNChange: (value: number) => void;
}

export const TopSellingFilter = ({
  dateRange,
  onDateChange,
  topN,
  onTopNChange,
}: TopSellingFilterProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bộ lọc Hàng Bán Chạy</CardTitle>
        <CardDescription>Lọc sản phẩm bán chạy nhất trong khoảng thời gian.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <Label htmlFor="topN" className="text-sm font-medium">Top Sản phẩm</Label>
          <Input
            id="topN"
            type="number"
            value={topN}
            onChange={(e) => onTopNChange(Number(e.target.value))}
            className="w-20 h-8 bg-card mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};