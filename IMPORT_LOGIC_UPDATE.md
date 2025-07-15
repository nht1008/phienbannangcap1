# Logic Nhập Hàng Thông Minh - Cập nhật lô hết hàng thay vì tạo mới

## Tổng quan

Hệ thống nhập hàng đã được cập nhật để tối ưu hóa việc quản lý khi sản phẩm hết hàng (quantity = 0).

## Logic mới

### Khi nhập hàng cho sản phẩm có quantity = 0:

- **Trước đây**: Luôn tạo lô mới (ví dụ: Lô 2, Lô 3, ...)
- **Bây giờ**: Cập nhật lại lô hiện tại với:
  - Số lượng mới
  - Giá gốc mới
  - Giá bán mới

### Khi nhập hàng cho sản phẩm còn hàng (quantity > 0):

- **Hành vi**: Vẫn tạo lô mới như cũ

## Ví dụ cụ thể

### Trường hợp 1: Sản phẩm hết hàng (quantity = 0)

```
Trước khi nhập:
- Hoa hồng đỏ Size M (Lô 1) - 0 cái - Giá gốc: 50k - Giá bán: 80k

Sau khi nhập 20 cái với giá gốc 60k, giá bán 90k:
- Hoa hồng đỏ Size M (Lô 1) - 20 cái - Giá gốc: 60k - Giá bán: 90k ✅ (CẬP NHẬT)

Thay vì:
- Hoa hồng đỏ Size M (Lô 1) - 0 cái - Giá gốc: 50k - Giá bán: 80k
- Hoa hồng đỏ Size M (Lô 2) - 20 cái - Giá gốc: 60k - Giá bán: 90k ❌ (TẠO MỚI)
```

### Trường hợp 2: Sản phẩm còn hàng (quantity > 0)

```
Trước khi nhập:
- Hoa lan trắng Size L (Lô 1) - 5 cái - Giá gốc: 40k - Giá bán: 70k

Sau khi nhập 15 cái với giá gốc 45k, giá bán 75k:
- Hoa lan trắng Size L (Lô 1) - 5 cái - Giá gốc: 40k - Giá bán: 70k
- Hoa lan trắng Size L (Lô 2) - 15 cái - Giá gốc: 45k - Giá bán: 75k ✅ (TẠO MỚI)
```

## Lợi ích

### Cho người bán

- ✅ **Giảm số lượng lô không cần thiết**: Không tạo lô 2, 3, 4... khi lô 1 đã hết hàng
- ✅ **Dễ quản lý**: Ít dòng sản phẩm hơn trong danh sách
- ✅ **Tiết kiệm thời gian**: Không cần xóa lô cũ hết hàng
- ✅ **Logic tự nhiên**: Khi hết hàng rồi nhập thêm = bổ sung hàng cho lô hiện tại

### Cho hệ thống

- ✅ **Tối ưu dữ liệu**: Ít records không cần thiết trong database
- ✅ **Hiệu suất tốt hơn**: Ít lô hàng = tính toán nhanh hơn
- ✅ **Tương thích**: Vẫn hoạt động với logic FIFO hiện tại

## Technical Implementation

### Files được thay đổi

1. **`src/components/tabs/ImportTab.tsx`**: Logic UI và xác định có cập nhật hay tạo mới
2. **`src/app/page.tsx`**: Logic backend xử lý cập nhật vs tạo mới
3. **`src/lib/batch-management.ts`**: Đã được cập nhật trước đó

### Các thay đổi chính

#### 1. **ImportTab.tsx**

- Cập nhật `getNextBatchNumber()` để trả về object chứa thông tin:
  ```typescript
  {
    batchNumber: number,
    shouldUpdate: boolean,
    productIdToUpdate: string | null
  }
  ```
- Hiển thị "Sẽ cập nhật lô X" vs "Sẽ tạo lô X mới"

#### 2. **page.tsx**

- Thêm logic kiểm tra `shouldUpdate` và `productIdToUpdate`
- Nếu `shouldUpdate = true`: Cập nhật sản phẩm hiện tại
- Nếu `shouldUpdate = false`: Tạo sản phẩm mới như cũ

## UI Changes

### Trong màn hình nhập hàng:

- **"Sẽ tạo lô 2 mới"** → **"Sẽ cập nhật lô 1 hiện có"** (khi quantity = 0)
- **"Sẽ tạo lô 3 mới"** → **"Sẽ tạo lô 2 mới"** (khi quantity > 0)

## Lưu ý quan trọng

- Logic này chỉ áp dụng cho việc nhập hàng, không ảnh hưởng đến bán hàng
- Hệ thống vẫn tương thích với tất cả chức năng hiện tại
- Batch number vẫn được quản lý đúng theo quy tắc FIFO
