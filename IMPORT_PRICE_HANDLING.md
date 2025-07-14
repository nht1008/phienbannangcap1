# Xử lý Giá khi Nhập hàng - Import Price Handling

## Tổng quan

Hệ thống hiện đã được cải tiến để xử lý thông minh các trường hợp xung đột giá khi nhập hàng. Khi sản phẩm có cùng thuộc tính (tên, màu, chất lượng, kích thước, đơn vị) nhưng có giá gốc khác với lần nhập trước, hệ thống sẽ:

## Quy trình xử lý

### 1. Phát hiện xung đột giá

- Khi người dùng nhập giá gốc khác với giá hiện tại trong kho (chênh lệch > 0.001 nghìn VND)
- Hệ thống sẽ hiển thị cảnh báo màu cam và mở dialog xử lý xung đột

### 2. Tùy chọn xử lý

Người dùng có 2 lựa chọn:

#### A. Giữ giá cũ (`priceAction: 'keep'`)

- Chỉ cập nhật số lượng sản phẩm
- Giá gốc trong kho không thay đổi
- Phù hợp khi muốn duy trì giá cũ ổn định

#### B. Cập nhật giá mới (`priceAction: 'update'`)

- Cập nhật cả số lượng và giá gốc
- Tự động điều chỉnh giá bán nếu margin quá thấp (< 10%)
- Phù hợp khi giá nhập thay đổi do lạm phát, nhà cung cấp mới, etc.

### 3. Xử lý tự động giá bán

Khi chọn "Cập nhật giá mới":

- Nếu margin hiện tại < 10% với giá gốc mới
- Nhưng margin cũ >= 10% với giá gốc cũ
- Hệ thống sẽ tự động cập nhật giá bán để duy trì tỷ suất lợi nhuận tương tự

## Ví dụ thực tế

### Trường hợp 1: Giá nhập tăng

```
Sản phẩm: Áo thun trắng - Size M
Giá gốc cũ: 50,000 VND
Giá bán hiện tại: 80,000 VND (margin: 60%)
Giá gốc mới: 60,000 VND

Nếu chọn "Cập nhật giá mới":
- Giá gốc: 60,000 VND
- Giá bán tự động: 96,000 VND (duy trì margin ~60%)
```

### Trường hợp 2: Giá nhập giảm

```
Sản phẩm: Quần jean đen - Size L
Giá gốc cũ: 100,000 VND
Giá bán hiện tại: 150,000 VND (margin: 50%)
Giá gốc mới: 80,000 VND

Nếu chọn "Cập nhật giá mới":
- Giá gốc: 80,000 VND
- Giá bán không thay đổi: 150,000 VND (margin tăng lên ~87.5%)
```

## Lợi ích

1. **Linh hoạt**: Cho phép người dùng quyết định cách xử lý giá
2. **Thông minh**: Tự động điều chỉnh giá bán khi cần thiết
3. **Minh bạch**: Hiển thị rõ ràng sự khác biệt và hậu quả
4. **Kiểm soát**: Người dùng có toàn quyền kiểm soát quyết định

## Lưu ý kỹ thuật

- Xung đột được phát hiện khi `Math.abs(newPrice - oldPrice) > 0.001`
- Chỉ cập nhật giá bán khi margin mới < 10% nhưng margin cũ >= 10%
- Giá bán được làm tròn lên để dễ tính toán
- Tất cả thay đổi được log vào console để theo dõi

## Code chính

- **Frontend**: `src/components/tabs/ImportTab.tsx`
- **Backend**: `src/app/page.tsx` (hàm `handleImportProducts`)
- **Interface**: `priceAction?: 'keep' | 'update'` trong `SubmitItemToImport`
