# Tối Ưu Hóa CustomerCartSheet Cho Thiết Bị Di Động

## Tổng Quan Cải Tiến

Đã tối ưu hóa hoàn toàn giao diện giỏ hàng khách hàng (CustomerCartSheet) để hiển thị tốt trên mọi thiết bị màn hình nhỏ.

## Chi Tiết Các Cải Tiến

### 1. Header Responsive (Dòng 86-118)

**Trước:**

- Header cố định với layout ngang, không phù hợp mobile
- Thông tin điểm và nút action bị chen chúc

**Sau:**

- Layout linh hoạt với `flex-col space-y-3`
- Title responsive với icon có kích thước thay đổi theo thiết bị
- Thông tin khách hàng và điểm được đóng gói trong card riêng biệt
- Responsive button sizing và spacing

### 2. Dual Layout System (Dòng 132-265)

**Desktop View (md:block):**

- Sử dụng Table component truyền thống
- Hiển thị đầy đủ thông tin trong các cột
- Tối ưu cho màn hình rộng

**Mobile View (md:hidden):**

- Card-based layout thay thế table
- Mỗi item trong card riêng biệt với `bg-muted/40 rounded-lg p-3`
- Thông tin được sắp xếp theo chiều dọc
- Image size tăng lên 64x64px cho mobile

### 3. Mobile Card Layout Features

```tsx
{
  /* Mobile Item Card */
}
<div className="bg-muted/40 rounded-lg p-3 space-y-3">
  {/* Product info section */}
  <div className="flex items-start justify-between gap-3">
    {/* Image + Details */}
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <Image className="w-16 h-16" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">Product Name</p>
        <div className="mt-1 space-y-0.5">{/* Unit and Price info */}</div>
      </div>
    </div>
    {/* Action buttons */}
    <div className="flex gap-1 flex-shrink-0">
      {/* Note and Delete buttons */}
    </div>
  </div>

  {/* Quantity controls + Price */}
  <div className="flex items-center justify-between gap-4">
    {/* Quantity controls */}
    {/* Total price */}
  </div>
</div>;
```

### 4. Summary Section Responsive (Dòng 269-315)

**Improvements:**

- Responsive text sizing: `text-base sm:text-lg`
- Full width layout thay vì `md:w-1/2`
- Mobile-optimized spacing và padding

### 5. Payment Section Mobile-First (Dòng 317-340)

**Features:**

- Responsive labels: `text-sm sm:text-base`
- QR code size tối ưu cho mobile (200px)
- Responsive padding: `p-3 sm:p-4`
- Font sizes thay đổi theo thiết bị

### 6. Footer Button Optimization (Dòng 346-352)

```tsx
<Button
  className="w-full bg-primary text-primary-foreground h-10 sm:h-12 text-sm sm:text-base"
  size="lg"
>
  Thanh toán
</Button>
```

- Height responsive: `h-10 sm:h-12`
- Text size responsive: `text-sm sm:text-base`
- Footer padding tối ưu: `py-3 sm:py-4`

## Breakpoints Sử Dụng

### Mobile-First Approach

- **Default (mobile)**: Tất cả styles mặc định cho mobile
- **sm: (≥640px)**: Tablet nhỏ adjustments
- **md: (≥768px)**: Chuyển đổi sang desktop layout

### Key Responsive Classes

- Layout: `flex-col sm:flex-row`, `space-y-3`, `gap-3`
- Sizing: `text-sm sm:text-base`, `h-10 sm:h-12`, `p-3 sm:p-4`
- Visibility: `md:hidden` (mobile only), `hidden md:block` (desktop only)
- Spacing: `px-4 sm:px-6`, `py-3 sm:py-4`

## Lợi Ích Đạt Được

1. **Touch-Friendly Interface**: Buttons và controls lớn hơn trên mobile
2. **Better Information Hierarchy**: Card layout dễ đọc hơn table trên mobile
3. **Optimized Space Usage**: Loại bỏ các cột không cần thiết trên mobile
4. **Improved User Experience**: Navigation và interaction dễ dàng hơn
5. **Consistent Design**: Unified design language across all devices

## Testing Guidelines

### Mobile Testing (< 640px)

- Kiểm tra card layout hiển thị đúng
- Verify touch targets đủ lớn (minimum 44px)
- Test scrolling behavior

### Tablet Testing (640px - 768px)

- Kiểm tra transition giữa mobile và desktop
- Verify responsive text sizing
- Test intermediate layouts

### Desktop Testing (> 768px)

- Kiểm tra table layout hoạt động bình thường
- Verify all columns hiển thị đầy đủ
- Test responsive hover states

## File Location

`src/components/orders/CustomerCartSheet.tsx`

## Dependencies

- Tailwind CSS responsive utilities
- Next.js Image component
- Shadcn/ui components (Sheet, Button, Input, etc.)
- QRCode.react library
