# Hướng dẫn Sử dụng Tính năng Lô hàng Nhập

## Tính năng mới: Cột Lô hàng trong Danh sách Sản phẩm

### Mô tả

Đã thêm cột "Lô hàng" vào danh sách sản phẩm trong tab "Quản lý sản phẩm" để phân biệt rõ ràng các lô hàng đã nhập. Mỗi lô hàng sẽ có giá gốc và giá bán khác nhau.

### Cách hoạt động

#### 1. **Tự động tạo số lô hàng**

- Khi thêm sản phẩm mới, hệ thống sẽ tự động tạo số lô hàng theo thứ tự tăng dần (1, 2, 3, ...)
- Số lô hàng được tính toán dựa trên số lô lớn nhất hiện có trong hệ thống + 1

#### 2. **Hiển thị trong danh sách sản phẩm**

- Cột "Lô hàng" được hiển thị ngay sau cột "Sản phẩm"
- Hiển thị dưới dạng badge màu xanh: "Lô 1", "Lô 2", "Lô 3",...
- Sản phẩm được sắp xếp theo thứ tự lô hàng tăng dần

#### 3. **Phân biệt giá giữa các lô hàng**

- Mỗi lô hàng có thể có giá gốc và giá bán khác nhau
- Người dùng có thể dễ dàng so sánh giá giữa các lô hàng
- Hỗ trợ quản lý tốt hơn cho các sản phẩm nhập ở thời điểm khác nhau

### Các thay đổi kỹ thuật

#### 1. **Cập nhật Product interface**

```typescript
export interface Product {
  // ... các trường hiện có
  batchNumber?: number; // Số lô hàng nhập
}
```

#### 2. **Cập nhật InvoiceCartItem interface**

```typescript
export interface InvoiceCartItem {
  // ... các trường hiện có
  batchNumber?: number; // Số lô hàng nhập
}
```

#### 3. **Cập nhật ProductFormDialog**

- Thêm logic tự động tạo batchNumber khi tạo sản phẩm mới
- Giữ nguyên batchNumber khi chỉnh sửa sản phẩm

#### 4. **Cập nhật InventoryTab**

- Thêm cột "Lô hàng" vào bảng danh sách sản phẩm
- Sắp xếp sản phẩm theo batchNumber tăng dần
- Hiển thị badge đẹp mắt cho số lô hàng

### Lợi ích

1. **Tách bạch rõ ràng**: Dễ dàng phân biệt các lô hàng nhập khác nhau
2. **Quản lý giá tốt hơn**: Theo dõi được giá gốc và giá bán của từng lô hàng
3. **Truy xuất nguồn gốc**: Biết được sản phẩm thuộc lô hàng nào
4. **Báo cáo chính xác**: Tính toán lợi nhuận chính xác theo từng lô hàng

### Sử dụng

1. Vào tab "Quản lý sản phẩm"
2. Click "Thêm sản phẩm" để tạo sản phẩm mới
3. Hệ thống sẽ tự động gán số lô hàng cho sản phẩm
4. Trong danh sách, bạn sẽ thấy cột "Lô hàng" hiển thị số lô của mỗi sản phẩm
5. Sản phẩm được sắp xếp theo thứ tự lô hàng từ 1, 2, 3, ...

### Lưu ý

- Sản phẩm cũ (không có batchNumber) sẽ hiển thị "Lô 1" và được xếp cuối danh sách
- Khi chỉnh sửa sản phẩm, số lô hàng sẽ được giữ nguyên
- Tính năng này hỗ trợ tương thích ngược với dữ liệu cũ
