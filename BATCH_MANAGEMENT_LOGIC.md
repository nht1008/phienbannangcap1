# Batch Management Logic - Quy tắc quản lý lô hàng

## Tổng quan

Hệ thống quản lý lô hàng đã được cập nhật để tối ưu hóa trải nghiệm người dùng khi chỉ có 1 lô hàng duy nhất.

## Quy tắc mới

### 1. Khi có ≥ 2 lô hàng trong cùng nhóm sản phẩm

- **Hành vi cũ được giữ nguyên**: Sau khi bán hết 1 lô, sản phẩm đó sẽ tự động bị xóa
- **Lô tiếp theo** sẽ tự động chuyển thành lô số 1 (lô cũ nhất)
- **Lý do**: Khi có nhiều lô, việc tự động chuyển lô giúp quản lý FIFO (First In, First Out)

### 2. Khi chỉ có 1 lô hàng duy nhất

- **Hành vi mới**: Sau khi bán hết, dòng sản phẩm **VẪN ĐƯỢC GIỮ LẠI**
- **Số lượng** sẽ hiển thị là 0
- **Lý do**: Tránh mất công phải thêm lại sản phẩm từ đầu khi nhập hàng mới

## Lợi ích

### Cho người bán

- ✅ **Tiết kiệm thời gian**: Không cần thêm lại sản phẩm từ đầu
- ✅ **Giữ nguyên thông tin**: Hình ảnh, mô tả, thuộc tính được bảo toàn
- ✅ **Dễ nhập hàng**: Khi có hàng mới, chỉ cần cập nhật số lượng

### Cho hệ thống

- ✅ **Tự động hóa thông minh**: Phân biệt được tình huống 1 lô vs nhiều lô
- ✅ **Quản lý FIFO hiệu quả**: Vẫn đảm bảo quy tắc lô cũ bán trước khi có nhiều lô
- ✅ **Dữ liệu nhất quán**: Batch number được tính toán chính xác

## Technical Implementation

### File được thay đổi

- `src/lib/batch-management.ts`: Logic chính xử lý việc xóa/giữ lại sản phẩm

### Các thay đổi chính

1. **reorderBatchNumbers()**: Thêm logic kiểm tra số lượng lô trong nhóm
2. **getNextBatchNumber()**: Tính cả lô hết hàng để tránh trùng batch number
3. **Logging**: Thêm thông tin chi tiết về việc giữ lại/xóa sản phẩm

### Ví dụ cụ thể

#### Trường hợp 1: Sản phẩm có 2 lô

```
Trước khi bán:
- Hoa hồng đỏ Size M (Lô 1) - 10 cái
- Hoa hồng đỏ Size M (Lô 2) - 15 cái

Sau khi bán hết Lô 1:
- Hoa hồng đỏ Size M (Lô 1) - BỊ XÓA ✅
- Hoa hồng đỏ Size M (Lô 2 → Lô 1) - 15 cái ✅
```

#### Trường hợp 2: Sản phẩm có 1 lô duy nhất

```
Trước khi bán:
- Hoa ly trắng Size L (Lô 1) - 5 cái

Sau khi bán hết:
- Hoa ly trắng Size L (Lô 1) - 0 cái ✅ (ĐƯỢC GIỮ LẠI)
```

## Lưu ý quan trọng

- Sản phẩm hết hàng (quantity = 0) vẫn hiển thị trong danh sách
- Khi nhập hàng mới cho sản phẩm đã hết, hệ thống sẽ tự động tạo lô mới
- Logic này chỉ áp dụng cho việc xóa sản phẩm hết hàng, không ảnh hưởng đến các chức năng khác
