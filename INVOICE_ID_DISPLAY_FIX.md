# ✅ Sửa lỗi hiển thị ID hóa đơn trong lịch sử công nợ

## 🎯 Vấn đề

Trong dialog "Lịch sử công nợ", ID hóa đơn không hiển thị đúng như trong tab "Lịch sử đặt hàng":

- **Trước**: Hiển thị `#JPUUK7` (6 ký tự cuối + format)
- **Mong muốn**: Hiển thị `-OVOx6okXE4nmRMIbLUW` (toàn bộ ID như trong cột "ID hóa đơn")

## 🔍 So sánh với tab "Lịch sử đặt hàng"

Trong `OrderHistoryTab.tsx`, cột "ID Hóa đơn" hiển thị:

```tsx
<TableCell>
  <span className="text-blue-500 cursor-pointer hover:underline">
    {invoice.id} // Toàn bộ ID, ví dụ: -OVOx6okXE4nmRMIbLUW
  </span>
</TableCell>
```

## ✅ Giải pháp đã áp dụng

### 1. **Cập nhật CustomerDebtHistoryDialog.tsx**

```tsx
// Trước
HĐ: #{entry.invoiceId.slice(-6).toUpperCase()}

// Sau - hiển thị toàn bộ ID
HĐ: {entry.invoiceId}
```

### 2. **Cập nhật debt-history.ts**

```typescript
// Trước
notes: `Tạo công nợ từ ${invoiceId ? `hóa đơn #${invoiceId.slice(-6).toUpperCase()}` : 'nhập hàng'}`,

// Sau - hiển thị toàn bộ ID
notes: `Tạo công nợ từ ${invoiceId ? `hóa đơn ${invoiceId}` : 'nhập hàng'}`,
```

### 3. **Loại bỏ debug logging**

Đã remove các console.log debug để code sạch hơn.

## 🎯 Kết quả

Bây giờ trong dialog "Lịch sử công nợ":

### **Mục "Tạo nợ":**

- **Ghi chú**: "Tạo công nợ từ hóa đơn -OVOx6okXE4nmRMIbLUW"
- **Hiển thị ID**: "HĐ: -OVOx6okXE4nmRMIbLUW"

### **Mục "Thanh toán":**

- **Ghi chú**: "Thanh toán công nợ" (hoặc ghi chú tùy chỉnh)
- **Hiển thị ID**: "HĐ: -OVOx6okXE4nmRMIbLUW" (nếu có liên quan)

## 🔗 **Đồng nhất với tab "Lịch sử đặt hàng"**

| Tab                  | Cách hiển thị ID           |
| -------------------- | -------------------------- |
| **Lịch sử đặt hàng** | `-OVOx6okXE4nmRMIbLUW`     |
| **Lịch sử công nợ**  | `HĐ: -OVOx6okXE4nmRMIbLUW` |

Cả hai đều hiển thị **toàn bộ ID Firebase** thay vì chỉ một phần.

## 🧪 Test

1. Tạo hóa đơn có nợ cho khách hàng
2. Kiểm tra ID hóa đơn trong tab "Lịch sử đặt hàng"
3. Mở dialog "Lịch sử công nợ" của khách hàng đó
4. **Xác nhận**: ID hiển thị giống nhau ở cả 2 nơi

## 📝 Lưu ý

- Thay đổi tương thích ngược hoàn toàn
- Build thành công không có lỗi
- Cải thiện UX với thông tin ID hóa đơn nhất quán

---

_Ngày cập nhật: 18/07/2025_
