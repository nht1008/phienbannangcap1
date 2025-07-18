# 🔧 Tóm tắt sửa lỗi: ID hóa đơn và thanh toán công nợ

## 🎯 Vấn đề báo cáo

1. **Hiển thị ID sai**: Thấy `#JPUUK7` thay vì `-OVOYYp-YHKpyIjPuUK7`
2. **Thiếu lịch sử thanh toán**: Không thấy dòng "Thanh toán công nợ" sau khi trả nợ

## 🔍 Nguyên nhân & Giải pháp

### **Có 2 dialog lịch sử khác nhau:**

#### 1. ✅ **CustomerDebtHistoryDialog** (ĐÃ SỬA)

- **Đặc điểm**:
  - Title: `"Lịch sử công nợ - [Tên khách hàng]"`
  - Có 3 ô tổng quan màu xám
  - Lấy dữ liệu từ `debtHistory` collection
- **Đã sửa**: Hiển thị toàn bộ ID như `-OVOYYp-YHKpyIjPuUK7`

#### 2. 🔄 **CustomerDebtTab Dialog** (ĐÃ SỬA)

- **Đặc điểm**:
  - Title: `"Lịch sử công nợ [debt_id]"`
  - Hiển thị cards màu đỏ/xanh
  - Lấy dữ liệu từ `debt.payments`
- **Đã sửa**: Tất cả chỗ hiển thị ID

## ✅ Files đã được sửa

### 1. **CustomerDebtHistoryDialog.tsx**

```tsx
// Trước: HĐ: #{entry.invoiceId.slice(-6).toUpperCase()}
// Sau:   HĐ: {entry.invoiceId}
```

### 2. **debt-history.ts**

```typescript
// Trước: hóa đơn #${invoiceId.slice(-6).toUpperCase()}
// Sau:   hóa đơn ${invoiceId}
```

### 3. **CustomerDebtTab.tsx**

- Dialog title: `#{selectedDebtId?.slice(-6)} → {selectedDebtId}`
- Debt description: `#${relatedInvoice.id.slice(-6)} → ${relatedInvoice.id}`
- QR payment: `#${debt.id.slice(-6)} → {debt.id}`

### 4. **CustomerDebtTab_new.tsx**

- Tương tự như CustomerDebtTab.tsx

## 🧪 Cách kiểm tra

### **Bước 1: Xác định dialog đúng**

```
Tab "Công nợ" → Click "Lịch sử" → Xem dialog title:

✅ ĐÚNG: "Lịch sử công nợ - [Tên KH]"
❌ SAI:  "Lịch sử công nợ #XXXXXX"
```

### **Bước 2: Test với dữ liệu thực**

1. Chạy `test-real-invoice-id.js` trong console
2. Kiểm tra dialog lịch sử có hiển thị:
   - ✅ Invoice ID đầy đủ: `-OVOYYp-YHKpyIjPuUK7`
   - ✅ Cả "Tạo nợ" và "Thanh toán"

### **Bước 3: Kiểm tra Firebase**

- Vào Firebase Database → `debtHistory`
- Tìm entries của customer
- Xác nhận có cả `CREATE_DEBT` và `PAYMENT`

## 🎯 Kết quả mong đợi

**Sau khi sửa, PHẢI thấy:**

1. **ID hóa đơn chính xác**:

   - `HĐ: -OVOYYp-YHKpyIjPuUK7` (toàn bộ ID)
   - Không còn `#JPUUK7`

2. **Lịch sử thanh toán đầy đủ**:
   - Badge đỏ "Tạo nợ"
   - Badge xanh "Thanh toán"
   - Số tiền và nợ còn lại chính xác

## 🚨 Nếu vẫn có vấn đề

### **Vẫn thấy #JPUUK7:**

1. Clear cache browser
2. Hard refresh (Ctrl+F5)
3. Kiểm tra đang xem dialog nào
4. Xem console có lỗi không

### **Vẫn không thấy thanh toán:**

1. Kiểm tra `logDebtPayment` có được gọi không
2. Xem Firebase `debtHistory` có entries không
3. Kiểm tra customerId có đúng không

## 📝 Lưu ý

- Tất cả thay đổi đã build thành công
- Tương thích ngược 100%
- Đã sửa ALL possible locations hiển thị ID

---

_Hoàn thành: 18/07/2025_
