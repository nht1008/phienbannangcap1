# Cải tiến Tab Công nợ - Hiển thị Tất cả Khách hàng

## Tổng quan

Tab công nợ đã được cải tiến để hiển thị **tất cả khách hàng** (bao gồm cả những khách hàng đã trả hết nợ) nhằm cho phép kiểm tra lịch sử tạo nợ và thanh toán công nợ của khách hàng.

## Thay đổi chính

### 1. Logic lọc dữ liệu (`src/app/page.tsx`)

- **Trước**: Chỉ hiển thị khách hàng còn nợ (`debt.remainingAmount > 0`)
- **Sau**: Hiển thị tất cả khách hàng có giao dịch công nợ (bao gồm cả đã trả hết)

```typescript
// Trước
const unpaidDebts = debtsData.filter(
  (debt) =>
    debt.remainingAmount > 0 &&
    debt.customerName &&
    (!debt.customerId || !debt.customerId.startsWith("SUPPLIER_"))
);

// Sau
const allDebts = debtsData.filter(
  (debt) =>
    debt.customerName &&
    (!debt.customerId || !debt.customerId.startsWith("SUPPLIER_"))
);
```

### 2. Cập nhật trạng thái công nợ

- Thêm logic tự động cập nhật trạng thái dựa trên số tiền còn lại
- Khách hàng đã trả hết nợ sẽ có trạng thái "Đã thanh toán"

```typescript
// Cập nhật trạng thái dựa trên số tiền còn lại
aggregatedDebt.status =
  aggregatedDebt.remainingAmount <= 0.01 ? "Đã thanh toán" : "Còn nợ";
```

### 3. Cải tiến giao diện (`src/components/tabs/DebtTab.tsx`)

- **Tiêu đề mới**: "Công nợ & Lịch sử Khách hàng"
- **Placeholder tìm kiếm**: "Tìm kiếm khách hàng theo tên, trạng thái, số tiền..."
- **Thống kê**: "Tổng nợ còn lại của tất cả khách hàng"
- **Thông báo**: Cập nhật các message phù hợp với tính năng mới

## Tính năng được cải thiện

### 1. Tìm kiếm và lọc

- Có thể tìm kiếm theo tên khách hàng, trạng thái
- Lọc theo trạng thái: "Tất cả", "Còn nợ", "Đã thanh toán", "Quá hạn"
- Smart search với highlights kết quả

### 2. Xem lịch sử chi tiết

- Nút "Toàn bộ LS" để xem toàn bộ lịch sử công nợ của khách hàng
- Bao gồm cả lịch sử tạo nợ và thanh toán

### 3. Quản lý thanh toán

- Nút "Thanh toán" chỉ hiển thị cho khách hàng còn nợ
- Khách hàng đã trả hết nợ sẽ disable nút thanh toán

## Lợi ích

1. **Theo dõi toàn diện**: Có thể xem lịch sử công nợ của tất cả khách hàng
2. **Kiểm tra lịch sử**: Dễ dàng kiểm tra các giao dịch đã hoàn thành
3. **Quản lý khách hàng**: Hiểu rõ hơn về mối quan hệ tín dụng với khách hàng
4. **Báo cáo**: Có cái nhìn tổng quan về tình hình công nợ

## Cách sử dụng

1. **Xem tất cả**: Mặc định hiển thị tất cả khách hàng có giao dịch công nợ
2. **Lọc theo trạng thái**: Sử dụng dropdown để lọc theo trạng thái cụ thể
3. **Tìm kiếm**: Gõ tên khách hàng để tìm kiếm nhanh
4. **Xem lịch sử**: Click "Toàn bộ LS" để xem chi tiết lịch sử công nợ
5. **Thanh toán**: Click "Thanh toán" cho khách hàng còn nợ

## Tương thích

- Tương thích ngược hoàn toàn với dữ liệu hiện có
- Không ảnh hưởng đến các tính năng khác
- Build và test thành công

---

_Ngày cập nhật: 14/07/2025_
