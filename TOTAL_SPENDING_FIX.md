# Sửa Logic Tổng Chi Tiêu - Bảng Xếp Hạng Khách Hàng

## Vấn đề

Trước đây, khi khách hàng thanh toán công nợ thông qua tab "Công nợ", cột "Tổng chi tiêu" trong bảng xếp hạng không được cập nhật. Chỉ khi thanh toán qua nút "Bán hàng" thì tổng chi tiêu mới thay đổi.

## Yêu cầu mới

Tổng chi tiêu chỉ tính **số tiền thực sự đã thanh toán**, và sẽ tăng dần khi khách hàng thanh toán công nợ:

- Lúc mua hàng 1,000,000 VNĐ, thanh toán 500,000 VNĐ (nợ 500,000 VNĐ) → Tổng chi tiêu: 500,000 VNĐ
- Thanh toán thêm 200,000 VNĐ → Tổng chi tiêu: 700,000 VNĐ
- Thanh toán hết 300,000 VNĐ còn lại → Tổng chi tiêu: 1,000,000 VNĐ

## Giải pháp

Kết hợp cả **số tiền đã thanh toán trong hóa đơn** và **số tiền thanh toán công nợ trực tiếp**.

### Thay đổi trong `src/app/page.tsx`

**Logic mới:**

```typescript
// Tính chi tiêu từ hóa đơn (chỉ phần đã thanh toán)
const paidAmount =
  invoice.amountPaid ?? invoice.total - (invoice.debtAmount || 0);
spendingMap.set(normalizedName, currentSpending + paidAmount);

// Tính thêm chi tiêu từ thanh toán công nợ trực tiếp
debtsData.forEach((debt) => {
  if (debt.payments && debt.customerName) {
    const payments = Array.isArray(debt.payments)
      ? debt.payments
      : Object.values(debt.payments || {});
    const totalDebtPayments = payments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );
    spendingMap.set(normalizedName, currentSpending + totalDebtPayments);
  }
});
```

### Thay đổi trong `src/components/tabs/LeaderboardTab.tsx`

**Logic tương tự:**

```typescript
// Tính chi tiêu từ hóa đơn (chỉ phần đã thanh toán)
const paidAmount =
  invoice.amountPaid ?? invoice.total - (invoice.debtAmount || 0);
customerData.totalSpent += paidAmount;

// Tính thêm chi tiêu từ thanh toán công nợ trực tiếp
debts.forEach((debt) => {
  const payments = Array.isArray(debt.payments)
    ? debt.payments
    : Object.values(debt.payments || {});
  const totalDebtPayments = payments.reduce(
    (sum, payment) => sum + payment.amountPaid,
    0
  );
  customerData.totalSpent += totalDebtPayments;
});
```

## Lý do cần tính thêm từ debt payments

Để đảm bảo tổng chi tiêu phản ánh **số tiền thực sự đã thanh toán**:

1. **Lúc tạo hóa đơn**: Chỉ tính phần đã thanh toán (`invoice.amountPaid` hoặc `invoice.total - invoice.debtAmount`)
2. **Khi thanh toán công nợ**: Cộng thêm số tiền thanh toán vào tổng chi tiêu

Điều này đảm bảo:

- Tổng chi tiêu luôn phản ánh **số tiền thực tế đã trả**
- Tăng dần theo từng lần thanh toán công nợ
- Khuyến khích khách hàng thanh toán công nợ để tăng hạng

## Kết quả

Sau khi thay đổi:

1. ✅ Tổng chi tiêu chỉ tính số tiền thực sự đã thanh toán
2. ✅ Thanh toán công nợ sẽ làm tăng tổng chi tiêu
3. ✅ Khuyến khích khách hàng thanh toán công nợ để tăng hạng
4. ✅ Bảng xếp hạng phản ánh chính xác khả năng thanh toán của khách hàng

## Ví dụ minh họa

**Khách hàng A mua hàng 1,000,000 VNĐ, thanh toán 500,000 VNĐ (nợ 500,000 VNĐ):**

| Thời điểm                    | Hành động                   | Tổng chi tiêu hiển thị |
| ---------------------------- | --------------------------- | ---------------------- |
| **Lúc mua**                  | Thanh toán 500,000 VNĐ      | 500,000 VNĐ            |
| **Thanh toán công nợ lần 1** | Trả thêm 200,000 VNĐ        | 700,000 VNĐ            |
| **Thanh toán công nợ lần 2** | Trả hết 300,000 VNĐ còn lại | 1,000,000 VNĐ          |

**So sánh với khách hàng B thanh toán ngay:**
| Khách hàng | Hành động | Tổng chi tiêu |
|------------|-----------|---------------|
| **A** | Mua 1 triệu, trả góp | 500k → 700k → 1 triệu |
| **B** | Mua 1 triệu, trả ngay | 1 triệu |

Như vậy, khách hàng A sẽ có động lực thanh toán công nợ để đạt được cùng hạng với khách hàng B.

---

_Ngày cập nhật: 14/07/2025_
