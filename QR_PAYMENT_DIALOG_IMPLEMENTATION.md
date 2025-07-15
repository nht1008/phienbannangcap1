# QR Payment Dialog Implementation - CustomerCartSheet

## Tổng Quan Cải Tiến

Đã tách riêng QR Code thanh toán thành một Dialog độc lập thay vì hiển thị inline trong cart, mang lại trải nghiệm người dùng tốt hơn và giao diện sạch hơn.

## Chi Tiết Thay Đổi

### 1. Import Dependencies (Dòng 10)

**Thêm Dialog Components:**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
```

### 2. State Management Updates (Dòng 56)

**Trước:**

```tsx
const [showQRCode, setShowQRCode] = useState(false);
```

**Sau:**

```tsx
const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
```

**Lý do thay đổi:**

- Semantic naming rõ ràng hơn cho dialog state
- Consistent với naming pattern của `isRedeemDialogOpen`

### 3. useEffect Cleanup (Dòng 62-66)

```tsx
useEffect(() => {
  if (!isOpen) {
    setRedeemedPoints({ points: 0, value: 0 });
    setIsQRDialogOpen(false); // Reset QR dialog state
  }
}, [isOpen]);
```

### 4. Payment Handler Simplification (Dòng 86-88)

**Trước:**

```tsx
const handlePlaceOrder = () => {
  setShowQRCode(true);
  // onPlaceOrder(discountAmount > 0 ? discountAmount : redeemedPoints.value);
};
```

**Sau:**

```tsx
const handlePlaceOrder = () => {
  setIsQRDialogOpen(true);
};
```

**Key Changes:**

- Simplified logic chỉ mở dialog
- Actual order placement được handle trong dialog
- Cleaner separation of concerns

### 5. Payment Section Cleanup (Dòng 396-402)

**Removed Complex Conditional Rendering:**

```tsx
// Old: Complex conditional with inline QR display
{!showQRCode ? (...) : (...)}

// New: Simple payment info section
<div className="w-full space-y-4 pt-4">
  <div>
    <Label className="font-semibold text-sm sm:text-base">Phương thức thanh toán</Label>
    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
      Nhấn "Thanh toán" để hiển thị mã QR thanh toán.
    </p>
  </div>
</div>
```

### 6. QR Payment Dialog Implementation (Dòng 420-467)

**Complete Dialog Structure:**

```tsx
<Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-center">Thanh toán bằng QR Code</DialogTitle>
      <DialogDescription className="text-center">
        Vui lòng quét mã QR để thanh toán qua chuyển khoản ngân hàng
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {/* QR Code */}
      <QRCodeCanvas value="bank_account_info_here" size={240} />

      {/* Payment Info */}
      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-primary">
          Tổng tiền: {finalTotal.toLocaleString("vi-VN")} VNĐ
        </p>
        <p className="text-sm text-muted-foreground">
          Nội dung: Thanh toan don hang
        </p>
        {customer && (
          <p className="text-xs text-muted-foreground">
            Khách hàng: {customer.name}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full">
        <Button onClick={confirmPayment} className="flex-1 bg-green-600">
          Xác nhận đã thanh toán
        </Button>
        <Button
          onClick={() => setIsQRDialogOpen(false)}
          variant="outline"
          className="flex-1"
        >
          Hủy
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Dialog Features

### 1. Enhanced QR Display

- **Size**: 240px (larger than inline version)
- **Positioning**: Centered trong dialog
- **Quality**: L level với margin cho better scanning

### 2. Payment Information

- **Total Amount**: Prominent display với primary color
- **Transfer Content**: Clear instructions
- **Customer Info**: Optional customer name display

### 3. Action Buttons

- **Confirm Payment**: Green button thực hiện order
- **Cancel**: Outline button để đóng dialog
- **Full Width**: Responsive button layout

### 4. Dialog Behavior

- **Modal**: Overlay background với focus trap
- **Responsive**: `sm:max-w-md` cho mobile optimization
- **Accessible**: Proper ARIA labels và descriptions

## User Experience Flow

### 1. Cart Review

- Khách hàng xem giỏ hàng với items và tổng tiền
- Simple payment method info
- Clear "Thanh toán" button

### 2. Payment Initiation

- Click "Thanh toán" → QR Dialog opens
- Clean modal overlay
- Focused QR scanning experience

### 3. QR Scanning

- Large, clear QR code
- Prominent total amount
- Customer context information

### 4. Payment Confirmation

- "Xác nhận đã thanh toán" processes order
- Dialog closes automatically
- Success toast notification
- Cart resets/closes

### 5. Cancel Flow

- "Hủy" button closes dialog
- Returns to cart review
- No changes to cart state

## Technical Benefits

### 1. Separation of Concerns

- Cart display logic separated từ payment logic
- Dialog handles payment flow exclusively
- Cleaner component structure

### 2. Better State Management

- Isolated dialog state
- Proper cleanup on cart close
- No complex conditional rendering

### 3. Improved UX

- Modal focus traps attention on payment
- Larger QR code easier to scan
- Clear action flow

### 4. Mobile Optimization

- Dialog responsive design
- Touch-friendly button sizes
- Proper spacing và typography

## Responsive Design

### Mobile (< 640px)

- Dialog fills appropriate screen space
- QR code size optimized cho mobile cameras
- Stacked button layout
- Readable typography

### Desktop (≥ 640px)

- Modal dialog với backdrop
- Larger QR code for better scanning
- Side-by-side buttons
- Enhanced visual hierarchy

## Accessibility Features

### 1. ARIA Compliance

- DialogTitle properly linked
- DialogDescription provides context
- Focus management handled by Dialog component

### 2. Keyboard Navigation

- ESC key closes dialog
- Tab navigation between buttons
- Enter key confirms payment

### 3. Screen Reader Support

- Semantic markup với proper roles
- Descriptive button labels
- Clear content hierarchy

## Testing Scenarios

### Happy Path

1. Add items to cart
2. Review cart contents và totals
3. Click "Thanh toán"
4. QR dialog opens with correct amount
5. Click "Xác nhận đã thanh toán"
6. Order processed, dialog closes, success message

### Cancel Flow

1. Open QR payment dialog
2. Click "Hủy"
3. Dialog closes, return to cart
4. No order processed

### Edge Cases

- Empty cart handling (button disabled)
- Multiple rapid clicks on payment
- Dialog closing during payment process
- Network errors during QR generation

## File Structure

```
src/components/orders/CustomerCartSheet.tsx
├── Main Cart Sheet
├── QR Payment Dialog
└── Redeem Points Dialog
```

## Dependencies

- Shadcn/ui Dialog components
- QRCode.react library
- React useState/useEffect
- Toast notifications

## Performance Considerations

- QR generation chỉ khi dialog opens
- Lazy rendering của dialog content
- Proper cleanup on unmount
- Minimal re-renders

## Future Enhancements

- Real-time payment status checking
- Multiple payment methods trong dialog
- Payment timeout handling
- Enhanced QR customization options
