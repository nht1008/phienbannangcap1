"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClassName: string;
  description?: string;
}

export const KpiCard = ({ title, value, icon, colorClassName, description }: KpiCardProps) => {
  return (
    <Card className={cn("relative overflow-hidden transition-transform hover:scale-105", colorClassName)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-white/80">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-white/90 pt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};