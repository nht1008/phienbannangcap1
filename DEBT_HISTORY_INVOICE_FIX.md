# 🔧 Sửa lỗi hiển thị thông tin hóa đơn trong lịch sử công nợ

## 🐛 Vấn đề

Trong dialog "Lịch sử công nợ" của khách hàng, mục **"Tạo nợ từ hóa đơn"** không hiển thị đúng với lịch sử mua hàng:

- Chỉ hiển thị text chung "Tạo công nợ từ hóa đơn"
- Không hiển thị mã hóa đơn cụ thể
- Thông tin hóa đơn chỉ hiển thị cho hành động "Thanh toán" mà không hiển thị cho "Tạo nợ"

## 🔍 Nguyên nhân

1. **Ghi chú không chi tiết**: Trong `src/lib/debt-history.ts`, ghi chú chỉ ghi chung chung là "Tạo công nợ từ hóa đơn" mà không bao gồm mã hóa đơn cụ thể.

2. **Logic hiển thị thiếu sót**: Trong `src/components/debt/CustomerDebtHistoryDialog.tsx`, thông tin hóa đơn chỉ được hiển thị cho hành động `PAYMENT` mà bỏ qua `CREATE_DEBT`.

## ✅ Giải pháp đã áp dụng

### 1. Cập nhật ghi chú chi tiết hơn (`src/lib/debt-history.ts`)

```typescript
// Trước
notes: `Tạo công nợ từ ${invoiceId ? 'hóa đơn' : 'nhập hàng'}`,

// Sau
notes: `Tạo công nợ từ ${invoiceId ? `hóa đơn ${invoiceId.slice(-8)}` : 'nhập hàng'}`,
```

### 2. Hiển thị thông tin hóa đơn cho tất cả hành động (`src/components/debt/CustomerDebtHistoryDialog.tsx`)

```tsx
// Trước - chỉ hiển thị cho PAYMENT
{
  entry.action === "PAYMENT" ? entry.notes || "-" : "-";
}
{
  entry.action === "PAYMENT" && entry.invoiceId && (
    <div className="text-xs text-muted-foreground mt-1">
      HĐ: {entry.invoiceId.slice(-8)}
    </div>
  );
}

// Sau - hiển thị cho tất cả hành động
{
  entry.notes || "-";
}
{
  entry.invoiceId && (
    <div className="text-xs text-muted-foreground mt-1">
      HĐ: {entry.invoiceId.slice(-8)}
    </div>
  );
}
```

## 🎯 Kết quả

Sau khi sửa, dialog lịch sử công nợ sẽ hiển thị:

### Cho hành động "Tạo nợ":

- **Ghi chú**: "Tạo công nợ từ hóa đơn abcd1234"
- **Mã hóa đơn**: "HĐ: abcd1234" (hiển thị bên dưới ghi chú)

### Cho hành động "Thanh toán":

- **Ghi chú**: "Thanh toán công nợ" hoặc ghi chú tùy chỉnh
- **Mã hóa đơn**: "HĐ: abcd1234" (nếu có liên quan đến hóa đơn)

## 🧪 Test

Sử dụng file `test-debt-history-invoice.js` để test:

1. Chạy script trong console trình duyệt
2. Kiểm tra dialog "Lịch sử công nợ"
3. Xác nhận thông tin hóa đơn hiển thị đầy đủ

## 📝 Ghi chú

- Thay đổi tương thích ngược, không ảnh hưởng dữ liệu cũ
- Build thành công không có lỗi
- Cải thiện trải nghiệm người dùng khi theo dõi lịch sử công nợ

---

_Ngày sửa: 18/07/2025_
