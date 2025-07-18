# 🐛 Debug vấn đề lịch sử công nợ

## 🎯 Các vấn đề được báo cáo

### 1. **Hiển thị mã hóa đơn không đúng**

- **Vấn đề**: Hiển thị `#JPUUK7` thay vì ID thực tế từ lịch sử mua hàng
- **Nguyên nhân có thể**:
  - Logic hiển thị mã hóa đơn không đồng nhất giữa các component
  - Sử dụng `.slice(-8)` thay vì `.slice(-6).toUpperCase()`

### 2. **Không hiển thị lịch sử thanh toán**

- **Vấn đề**: Sau khi thanh toán công nợ trực tiếp ở cửa hàng, chỉ thấy "Tạo nợ" mà không thấy "Thanh toán"
- **Nguyên nhân có thể**:
  - Hàm `logDebtPayment` không được gọi
  - Query dữ liệu trong `CustomerDebtHistoryDialog` có vấn đề
  - Dữ liệu không được lưu vào Firebase đúng cách

## ✅ Giải pháp đã áp dụng

### 1. **Đồng nhất hiển thị mã hóa đơn**

```tsx
// Trước (CustomerDebtHistoryDialog.tsx)
HĐ: {entry.invoiceId.slice(-8)}

// Sau - đồng nhất với các component khác
HĐ: #{entry.invoiceId.slice(-6).toUpperCase()}
```

```typescript
// Trước (debt-history.ts)
notes: `Tạo công nợ từ ${invoiceId ? `hóa đơn ${invoiceId.slice(-8)}` : 'nhập hàng'}`,

// Sau - đồng nhất format
notes: `Tạo công nợ từ ${invoiceId ? `hóa đơn #${invoiceId.slice(-6).toUpperCase()}` : 'nhập hàng'}`,
```

### 2. **Thêm debug logging**

**Trong `CustomerDebtHistoryDialog.tsx`:**

```tsx
console.log("🔍 Debt history raw data:", data);
console.log("🔍 Debt history array:", historyArray);
console.log("🔍 Customer ID:", customerId);
```

**Trong `debt-history.ts`:**

```typescript
console.log("🔥 LOGGING DEBT PAYMENT:", {
  customerId,
  customerName,
  paymentAmount,
  remainingDebt,
  // ...
});
```

## 🧪 Cách kiểm tra

### 1. **Sử dụng debug script**

```bash
# Chạy file debug-debt-history.js trong console trình duyệt
```

### 2. **Kiểm tra manual**

1. Tạo hóa đơn có nợ cho khách hàng
2. Thanh toán một phần công nợ từ Tab Công nợ
3. Mở dialog "Lịch sử công nợ" của khách hàng đó
4. Kiểm tra:
   - ✅ Có cả "Tạo nợ" và "Thanh toán"
   - ✅ Mã hóa đơn hiển thị format `#XXXXXX`
   - ✅ Số tiền và nợ còn lại chính xác

### 3. **Kiểm tra Firebase Database**

- Vào tab `debtHistory` trong Firebase Console
- Xem các entry có được tạo đúng không
- Kiểm tra các field: `customerId`, `action`, `amount`, `remainingDebt`

## 🔧 Nếu vẫn có vấn đề

### **Thanh toán không hiển thị:**

1. Kiểm tra console có log `🔥 LOGGING DEBT PAYMENT` không
2. Kiểm tra Firebase Database có entry `PAYMENT` không
3. Kiểm tra `customerId` trong query có chính xác không

### **Mã hóa đơn sai:**

1. Kiểm tra `invoiceId` trong debt history entry
2. So sánh với invoice thực tế trong Firebase
3. Kiểm tra logic tạo invoice ID

## 📝 Ghi chú

- Các thay đổi tương thích ngược
- Build thành công không có lỗi
- Debug logging sẽ được remove sau khi fix xong

---

_Ngày debug: 18/07/2025_
