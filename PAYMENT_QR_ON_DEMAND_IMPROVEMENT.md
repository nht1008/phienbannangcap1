# Cải Tiến Logic Thanh Toán CustomerCartSheet - QR Code On Demand

## Tổng Quan Thay Đổi

Đã cải tiến logic thanh toán để mã QR chỉ xuất hiện sau khi khách hàng nhấn nút "Thanh toán", thay vì hiển thị ngay từ đầu trong giỏ hàng.

## Chi Tiết Các Thay Đổi

### 1. State Management (Dòng 55-56)

**Thêm State:**

```tsx
const [showQRCode, setShowQRCode] = useState(false);
```

**Reset State khi đóng cart:**

```tsx
useEffect(() => {
  if (!isOpen) {
    setRedeemedPoints({ points: 0, value: 0 });
    setShowQRCode(false); // Reset QR display state
  }
}, [isOpen]);
```

### 2. Payment Flow Logic (Dòng 80-83)

**Trước:**

```tsx
const handlePlaceOrder = () => {
  onPlaceOrder(discountAmount > 0 ? discountAmount : redeemedPoints.value);
};
```

**Sau:**

```tsx
const handlePlaceOrder = () => {
  setShowQRCode(true); // Show QR code first
  // onPlaceOrder is called later after payment confirmation
};
```

### 3. Conditional QR Display (Dòng 350-405)

**Two-Stage Payment UI:**

#### Stage 1: Pre-Payment (Default)

```tsx
{!showQRCode ? (
  <div className="w-full space-y-4 pt-4">
    <div>
      <Label className="font-semibold text-sm sm:text-base">Phương thức thanh toán</Label>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
        Nhấn "Thanh toán" để hiển thị mã QR thanh toán.
      </p>
    </div>
  </div>
) : (
  // Stage 2: QR Code Display
)}
```

#### Stage 2: QR Code & Confirmation

```tsx
<div className="w-full space-y-4 pt-4">
  <div>
    <Label className="font-semibold text-sm sm:text-base">
      Thanh toán bằng QR Code
    </Label>
    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
      Vui lòng quét mã QR để thanh toán qua chuyển khoản ngân hàng.
    </p>
  </div>

  <div className="flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg bg-muted/20">
    {/* QR Code Display */}
    <QRCodeCanvas value="bank_account_info_here" size={200} />

    {/* Payment Amount */}
    <p className="mt-2 text-sm sm:text-base text-center font-semibold">
      Tổng tiền: {finalTotal.toLocaleString("vi-VN")} VNĐ
    </p>

    {/* Action Buttons */}
    <div className="flex gap-2 mt-4 w-full">
      <Button
        onClick={confirmPayment}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        Xác nhận đã thanh toán
      </Button>
      <Button
        onClick={() => setShowQRCode(false)}
        variant="outline"
        className="flex-1"
      >
        Quay lại
      </Button>
    </div>
  </div>
</div>
```

### 4. Footer Button Conditional Display (Dòng 415-421)

**Logic Update:**

```tsx
{
  cart.length > 0 && !showQRCode && (
    <SheetFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t">
      <Button
        onClick={handlePlaceOrder}
        className="w-full bg-primary text-primary-foreground h-10 sm:h-12 text-sm sm:text-base"
        size="lg"
      >
        Thanh toán
      </Button>
    </SheetFooter>
  );
}
```

**Key Points:**

- Footer button chỉ hiển thị khi chưa show QR (`!showQRCode`)
- Sau khi hiển thị QR, action buttons được tích hợp trong QR section

### 5. Payment Confirmation Flow

**Confirm Payment Function:**

```tsx
onClick={() => {
  onPlaceOrder(discountAmount > 0 ? discountAmount : redeemedPoints.value);
  toast({
    title: "Thành công",
    description: "Đơn hàng đã được xử lý. Cảm ơn bạn đã mua hàng!"
  });
}}
```

## User Experience Flow

### 1. Initial State

- Khách hàng xem giỏ hàng với tổng tiền
- Thấy message "Nhấn 'Thanh toán' để hiển thị mã QR thanh toán"
- Nút "Thanh toán" ở footer

### 2. After Clicking "Thanh toán"

- QR code xuất hiện với thông tin thanh toán
- Hiển thị tổng tiền cần thanh toán
- Có 2 options:
  - "Xác nhận đã thanh toán" (green button)
  - "Quay lại" (outline button)

### 3. Payment Confirmation

- Khách nhấn "Xác nhận đã thanh toán"
- Đơn hàng được xử lý (`onPlaceOrder` called)
- Toast notification thành công
- Cart được đóng/reset

### 4. Cancel/Back Flow

- Khách nhấn "Quay lại"
- QR code ẩn đi, quay về trạng thái ban đầu
- Có thể chỉnh sửa giỏ hàng hoặc thử thanh toán lại

## Lợi Ích Của Thay Đổi

### 1. Better User Experience

- Không overwhelming với QR code ngay từ đầu
- Clear step-by-step payment process
- User có control hơn về payment flow

### 2. Cleaner Interface

- Giỏ hàng focus vào review items trước
- QR code chỉ xuất hiện khi cần thiết
- Less visual clutter

### 3. Mobile Optimization

- QR code được optimized cho mobile display
- Clear action buttons with proper sizing
- Better touch targets và spacing

### 4. Flexible Payment Flow

- User có thể quay lại chỉnh sửa trước khi thanh toán
- Clear confirmation step
- Better error handling potential

## Technical Implementation

### State Management

- `showQRCode` boolean state controls UI flow
- Proper cleanup khi cart đóng
- Isolated payment state từ cart state

### Component Structure

- Conditional rendering cho payment sections
- Modular button placement
- Clean separation of concerns

### Responsive Design

- QR code size optimized cho mobile
- Button layout responsive
- Text sizing adaptive

## Testing Scenarios

### Happy Path

1. Add items to cart
2. Click "Thanh toán"
3. QR code appears
4. Click "Xác nhận đã thanh toán"
5. Order processed successfully

### Cancel Flow

1. Add items to cart
2. Click "Thanh toán"
3. QR code appears
4. Click "Quay lại"
5. Back to cart review state

### Edge Cases

- Empty cart handling
- Network errors during QR display
- Multiple rapid clicks on payment buttons

## File Location

`src/components/orders/CustomerCartSheet.tsx`

## Dependencies

- React useState/useEffect
- QRCode.react library
- Shadcn/ui components
- Toast notifications
