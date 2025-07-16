# Cải Tiến Cart Components - Ưu Đãi Hạng Tự Áp Dụng & Định Dạng Tiền Tệ Compact

## Tổng Quan Cải Tiến

Đã thực hiện hai cải tiến chính cho cả CustomerCartSheet và EmployeeCartSheet:

1. **Ưu đãi hạng tự áp dụng**: Khách hàng có thể tự áp dụng/hủy ưu đãi hạng theo ý muốn (CustomerCartSheet)
2. **Định dạng tiền tệ compact**: Ẩn đơn vị VNĐ và chuyển đổi 1000 → 1K để tiết kiệm không gian (cả hai components)

## Chi Tiết Các Thay Đổi

### 1. Utility Function - Compact Currency Format

**File:** `src/lib/utils.ts`

```typescript
export function formatCompactCurrency(
  amount: number,
  showUnit: boolean = false
): string {
  if (amount === 0) return showUnit ? "0" : "0";

  if (amount >= 1000) {
    const thousands = amount / 1000;
    const formatted =
      thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1);
    return showUnit ? `${formatted}K` : formatted + "K";
  }

  return showUnit ? amount.toString() : amount.toString();
}
```

**Quy tắc format:**

- 1000 → 1K
- 1500 → 1.5K
- 1000000 → 1000K
- 2500000 → 2500K
- Dưới 1000 → hiển thị nguyên

### 2. State Management Cải Tiến

**File:** `src/components/orders/CustomerCartSheet.tsx`

**Thêm State:**

```typescript
const [appliedTierDiscount, setAppliedTierDiscount] = useState({
  amount: 0,
  percentage: 0,
});
const [tierDiscountInfo, setTierDiscountInfo] = useState<{
  remaining?: number;
  period?: string;
}>({});
```

**Logic Reset:**

```typescript
useEffect(() => {
  if (!isOpen) {
    setRedeemedPoints({ points: 0, value: 0 });
    setAppliedTierDiscount({ amount: 0, percentage: 0 });
    setTierDiscountInfo({});
    setIsQRDialogOpen(false);
  }
}, [isOpen]);
```

### 3. Tier Discount Control Functions

**Apply Tier Discount:**

```typescript
const handleApplyTierDiscount = () => {
  if (redeemedPoints.value > 0) {
    toast({
      title: "Lỗi",
      description: "Không thể áp dụng ưu đãi hạng khi đã đổi điểm.",
      variant: "destructive",
    });
    return;
  }
  if (customer) {
    const result = calculateDiscount(customer, totalAmount, invoices);
    setTierDiscountInfo({
      remaining: result.remainingUses,
      period: result.usagePeriod,
    });
    if (result.success) {
      setAppliedTierDiscount({
        amount: result.discountAmount,
        percentage: result.discountPercentage,
      });
      toast({
        title: "Thành công",
        description: result.message,
        variant: "default",
      });
    } else {
      setAppliedTierDiscount({ amount: 0, percentage: 0 });
      toast({
        title: "Không thể áp dụng",
        description: result.message,
        variant: "destructive",
      });
    }
  }
};
```

**Cancel Tier Discount:**

```typescript
const handleCancelTierDiscount = () => {
  setAppliedTierDiscount({ amount: 0, percentage: 0 });
  setTierDiscountInfo({});
  toast({
    title: "Đã hủy",
    description: "Đã hủy bỏ ưu đãi cấp bậc.",
    variant: "default",
  });
};
```

### 4. UI Component Cải Tiến

**Tier Discount Control Section:**

```tsx
{
  /* Tier Discount Row */
}
{
  customer.tier && customer.tier !== "Vô danh" && (
    <div className="flex items-center justify-between gap-2 pt-2 border-t">
      <div className="flex items-center text-sm sm:text-base">
        <span className="font-medium text-muted-foreground">Ưu đãi hạng:</span>
        <span className="ml-2 font-bold text-primary">
          {appliedTierDiscount.amount > 0
            ? `Đã giảm ${formatCompactCurrency(appliedTierDiscount.amount)}`
            : "Chưa áp dụng"}
        </span>
        {tierDiscountInfo.period &&
          typeof tierDiscountInfo.remaining === "number" &&
          appliedTierDiscount.amount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Còn{" "}
              {tierDiscountInfo.remaining - 1 < 0
                ? 0
                : tierDiscountInfo.remaining - 1}{" "}
              lượt/{tierDiscountInfo.period})
            </span>
          )}
      </div>

      {/* Tier Discount Action Button */}
      <div>
        {appliedTierDiscount.amount > 0 ? (
          <Button
            onClick={handleCancelTierDiscount}
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
          >
            Hủy ưu đãi
          </Button>
        ) : (
          <Button
            onClick={handleApplyTierDiscount}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            Áp dụng ưu đãi
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 5. Currency Display Updates

**Desktop Table:**

```tsx
{
  /* Đơn giá */
}
<TableCell className="text-right">
  <div className="font-medium">{formatCompactCurrency(item.price)}</div>
</TableCell>;

{
  /* Thành tiền */
}
<TableCell className="text-right font-semibold text-primary">
  <div className="font-semibold">
    {formatCompactCurrency(item.price * item.quantityInCart)}
  </div>
</TableCell>;
```

**Mobile Cards:**

```tsx
<p className="text-sm font-medium text-primary">{formatCompactCurrency(item.price)}</p>

<p className="font-semibold text-sm text-primary">
  {formatCompactCurrency(item.price * item.quantityInCart)}
</p>
```

**Summary Section:**

```tsx
<div className="flex justify-between w-full text-base sm:text-lg font-semibold">
  <p>Tổng cộng:</p>
  <p>{formatCompactCurrency(totalAmount)}</p>
</div>;

{
  appliedTierDiscount.amount > 0 && (
    <div className="flex justify-between w-full text-sm sm:text-lg font-semibold text-green-600">
      <div className="flex flex-col">
        <p>
          Giảm giá ({customer?.tier} -{" "}
          {Math.round(appliedTierDiscount.percentage * 100) / 100}%):
        </p>
        {tierDiscountInfo.period &&
          typeof tierDiscountInfo.remaining === "number" && (
            <p className="text-xs text-muted-foreground font-normal">
              (Còn{" "}
              {tierDiscountInfo.remaining - 1 < 0
                ? 0
                : tierDiscountInfo.remaining - 1}{" "}
              lượt trong {tierDiscountInfo.period} này)
            </p>
          )}
      </div>
      <p>-{formatCompactCurrency(appliedTierDiscount.amount)}</p>
    </div>
  );
}

<div className="flex justify-between w-full text-lg sm:text-xl font-bold text-primary">
  <p>Thành tiền:</p>
  <p>{formatCompactCurrency(finalTotal)}</p>
</div>;
```

## Lợi Ích Đạt Được

### 1. User Experience

- **Kiểm soát linh hoạt**: Khách hàng có thể chọn áp dụng ưu đãi hạng khi cần thiết
- **Thông tin rõ ràng**: Hiển thị tình trạng ưu đãi và số lượt còn lại
- **Interface gọn gàng**: Định dạng compact tiết kiệm không gian màn hình

### 2. Mobile Optimization

- **Compact display**: 1500000 VNĐ → 1500K (tiết kiệm không gian hiển thị)
- **Clean layout**: Loại bỏ đơn vị VNĐ lặp lại
- **Touch-friendly**: Nút điều khiển ưu đãi dễ tương tác

### 3. Functional Benefits

- **Conflict prevention**: Không thể áp dụng ưu đãi hạng khi đã đổi điểm
- **Usage tracking**: Hiển thị số lượt ưu đãi còn lại trong kỳ
- **State persistence**: Reset state khi đóng/mở giỏ hàng

## Testing Scenarios

### 1. Tier Discount Flow

1. Khách hàng có tier (Đầy tớ, Nông dân, v.v.)
2. Click "Áp dụng ưu đãi" → Hiển thị discount và số lượt còn lại
3. Click "Hủy ưu đãi" → Reset về trạng thái ban đầu
4. Thử áp dụng khi đã đổi điểm → Hiển thị lỗi conflict

### 2. Currency Format Display

1. Kiểm tra items với giá < 1000 → Hiển thị nguyên
2. Kiểm tra items với giá 1000-999999 → Hiển thị định dạng K
3. Kiểm tra items với giá >= 1000000 → Hiển thị định dạng K (1000K, 2500K, etc.)
4. Kiểm tra tổng tiền với số thập phân → 1.5K, 2500K

### 3. Mobile/Desktop Compatibility

1. Test responsive layout trên mobile và desktop
2. Verify tier discount controls hoạt động đúng trên cả hai platform
3. Check currency format hiển thị consistent

## Files Modified

### 1. Core Utility Function

- `src/lib/utils.ts` - Added `formatCompactCurrency` function

### 2. Customer Cart Component

- `src/components/orders/CustomerCartSheet.tsx` - Added tier discount controls + compact currency

### 3. Employee Cart Component

- `src/components/orders/EmployeeCartSheet.tsx` - Applied compact currency formatting

## Dependencies

- **Existing**: `calculateDiscount` từ `@/lib/tiers`
- **New**: `formatCompactCurrency` từ `@/lib/utils`
- **UI Components**: Button, Toast notifications
- **State Management**: React useState, useEffect

---

_Ngày cập nhật: 17/07/2025_
