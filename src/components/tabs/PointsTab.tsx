"use client";

import React from 'react';
import type { Customer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PointsTabProps {
  customers: Customer[];
}

export function PointsTab({ customers }: PointsTabProps) {
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Đổi điểm</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Chức năng đổi điểm đang được phát triển.</p>
        </CardContent>
      </Card>
    </div>
  );
}
