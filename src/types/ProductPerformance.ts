interface ProductPerformance {
  id: string;
  key: string;
  name: string;
  color: string;
  quality?: string;
  size: string;
  unit: string;
  image: string;
  currentStock: number;
  soldInPeriod: number;
  revenueInPeriod: number;
  profitInPeriod: number;
  profitMarginPercentage?: number; // Tỷ suất lợi nhuận (%) = (Lợi nhuận / Doanh thu) * 100
  contributionPercentage?: number; // Tỷ lệ đóng góp (%) = (Doanh thu SP / Tổng Doanh thu kỳ) * 100
}

export default ProductPerformance;
