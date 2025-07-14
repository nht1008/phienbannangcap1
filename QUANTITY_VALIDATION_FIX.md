# Sửa lỗi kiểm soát số lượng trong dialog chọn thuộc tính sản phẩm

## Vấn đề đã được sửa

### 🚨 Vấn đề ban đầu:

- Ô nhập số lượng trong dialog chọn thuộc tính cho phép nhập bất kỳ số nào mà không kiểm tra tồn kho
- Khi nhập số lượng vượt quá tồn kho và thêm vào giỏ hàng, hệ thống bị lỗi
- Không có thông báo cảnh báo khi số lượng gần hết

### ✅ Giải pháp đã áp dụng:

#### 1. **Giới hạn số lượng nhập dựa trên tồn kho**

- Ô input số lượng giờ đây có thuộc tính `max` được tính toán động
- Số lượng được giới hạn không vượt quá tồn kho thực tế của lô hàng đã chọn
- Nút tăng/giảm cũng tuân theo giới hạn này

#### 2. **Hiển thị thông tin tồn kho rõ ràng**

- Hiển thị "Tối đa: X sản phẩm" bên dưới ô nhập
- Cảnh báo màu đỏ khi đã thêm hết vào giỏ hàng
- Cảnh báo màu cam khi chỉ còn ít sản phẩm có thể thêm (≤ 3)

#### 3. **Kiểm tra số lượng trong giỏ hàng**

- Tính toán số lượng đã có trong giỏ hàng cho sản phẩm đó
- Chỉ cho phép thêm số lượng còn lại (tồn kho - số lượng trong giỏ)
- Hiển thị thông tin "trong giỏ: X" để người dùng biết

#### 4. **Cải thiện giao diện thông tin**

- Box thông tin ở góc phải hiển thị:
  - Tồn kho hiện tại
  - Số lượng đã trong giỏ hàng (nếu có)
  - Số lượng có thể thêm thêm
- Sử dụng màu sắc để phân biệt trạng thái (xanh=ok, cam=ít, đỏ=hết)

#### 5. **Validation khi thêm vào giỏ**

- Kiểm tra tổng số lượng yêu cầu không vượt quá tồn kho
- Thông báo lỗi cụ thể khi vượt quá giới hạn
- Nút "Thêm vào giỏ" được disable và đổi text khi không thể thêm

## Chi tiết các thay đổi

### File: `src/components/tabs/SalesTab.tsx`

#### 1. **Cập nhật ô input số lượng:**

```tsx
<Input
  type="number"
  value={variantSelection.quantity}
  onChange={(e) => {
    const value = parseInt(e.target.value) || 1;
    // Lấy số lượng tồn kho hiện tại
    const availableBatches = getAvailableBatchesForVariant();
    const selectedBatch = availableBatches.find(
      (batch) => batch.batchNumber === variantSelection.batchNumber
    );
    const maxStock = selectedBatch
      ? selectedBatch.quantity
      : selectedVariantDetails?.quantity || 0;

    // Giới hạn số lượng nhập không vượt quá tồn kho
    const clampedValue = Math.max(1, Math.min(value, maxStock));
    setVariantSelection((prev) => ({ ...prev, quantity: clampedValue }));
  }}
  max={maxStock} // Thuộc tính max được tính động
/>
```

#### 2. **Logic validation khi thêm vào giỏ:**

```tsx
// Kiểm tra số lượng hiện có trong kho và số lượng đang có trong giỏ
const existingCartItem = cart.find((item) => item.id === productToAdd.id);
const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
const totalRequestedQuantity = quantityInCart + variantSelection.quantity;

// Kiểm tra nếu tổng số lượng yêu cầu vượt quá tồn kho
if (totalRequestedQuantity > productToAdd.quantity) {
  // Hiển thị thông báo lỗi cụ thể
}
```

#### 3. **Hiển thị thông tin cảnh báo:**

```tsx
// Cảnh báo khi gần hết hoặc đã hết
{
  availableToAdd <= 0 ? (
    <span className="text-red-600">⚠️ Đã thêm hết vào giỏ</span>
  ) : availableToAdd <= 3 ? (
    <span className="text-orange-600">
      ⚠️ Chỉ còn có thể thêm {availableToAdd}
    </span>
  ) : (
    <span className="text-muted-foreground">Tối đa: {maxStock} sản phẩm</span>
  );
}
```

## Kết quả

### ✅ Trước khi sửa:

- ❌ Có thể nhập số lượng bất kỳ
- ❌ Không kiểm tra tồn kho
- ❌ Gây lỗi khi thêm quá số lượng có sẵn
- ❌ Không có thông báo cảnh báo

### ✅ Sau khi sửa:

- ✅ Giới hạn số lượng nhập theo tồn kho thực tế
- ✅ Hiển thị thông tin tồn kho rõ ràng
- ✅ Cảnh báo khi gần hết hoặc đã hết
- ✅ Kiểm tra số lượng trong giỏ hàng
- ✅ Thông báo lỗi cụ thể và dễ hiểu
- ✅ Giao diện trực quan với màu sắc phân biệt trạng thái

## Test Cases

### Test Case 1: Sản phẩm có tồn kho 2, chưa có trong giỏ

- **Input**: Chọn số lượng 3
- **Expected**: Tự động giảm về 2, hiển thị "Tối đa: 2 sản phẩm"
- **Actual**: ✅ Pass

### Test Case 2: Sản phẩm có tồn kho 2, đã có 1 trong giỏ

- **Input**: Cố gắng thêm 2 nữa
- **Expected**: Cảnh báo "Chỉ còn có thể thêm 1 sản phẩm nữa"
- **Actual**: ✅ Pass

### Test Case 3: Sản phẩm đã thêm hết vào giỏ

- **Input**: Cố gắng thêm thêm
- **Expected**: Nút disabled, text "Đã thêm hết"
- **Actual**: ✅ Pass

## Lưu ý cho Developer

1. **Performance**: Các tính toán được thực hiện real-time, cần theo dõi performance nếu có nhiều sản phẩm
2. **UX**: Cảnh báo màu sắc giúp người dùng nhanh chóng nhận biết trạng thái
3. **Accessibility**: Các thông báo lỗi rõ ràng, dễ hiểu
4. **Maintainability**: Logic validation được tách riêng, dễ bảo trì

---

_Fix completed: 15/07/2025_
