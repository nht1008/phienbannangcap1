# Cải tiến Tab Phân tích Sản phẩm Bán chậm

## Tổng quan

Đã cập nhật tab phân tích sản phẩm bán chậm để **bao gồm cả những sản phẩm đã bị loại bỏ** từ tab "Loại bỏ sản phẩm". Tính năng này giúp có cái nhìn toàn diện hơn về hiệu suất sản phẩm.

## Các thay đổi chính

### 1. **Cập nhật AnalysisTab Component**

- ✅ Thêm `disposalLogEntries` vào props
- ✅ Cải tiến logic tính toán `slowSellingProducts` để bao gồm dữ liệu loại bỏ
- ✅ Sắp xếp sản phẩm: ưu tiên sản phẩm có loại bỏ trước

### 2. **Cải tiến SlowSellingProductsTable Component**

- ✅ Thêm cột "Đã loại bỏ" để hiển thị số lượng đã loại bỏ
- ✅ Hiển thị badge "Có loại bỏ" cho sản phẩm đã từng bị loại bỏ
- ✅ Hiển thị lý do loại bỏ dưới thuộc tính sản phẩm
- ✅ Hiển thị ngày loại bỏ gần nhất
- ✅ Cập nhật title và description để phản ánh tính năng mới

### 3. **Cập nhật Data Flow**

- ✅ Truyền `disposalLogEntries` từ `page.tsx` vào `AnalysisTab`
- ✅ Lọc disposal log entries theo khoảng thời gian được chọn
- ✅ Kết hợp dữ liệu bán hàng và dữ liệu loại bỏ

## Tính năng mới

### **Thông tin Loại bỏ trong Phân tích**

1. **Cột "Đã loại bỏ"**:

   - Hiển thị số lượng sản phẩm đã bị loại bỏ trong khoảng thời gian
   - Hiển thị ngày loại bỏ gần nhất

2. **Badge "Có loại bỏ"**:

   - Hiển thị bên cạnh tên sản phẩm để dễ nhận biết
   - Màu đỏ để thu hút sự chú ý

3. **Lý do loại bỏ**:

   - Hiển thị dưới thuộc tính sản phẩm
   - Kết hợp nhiều lý do nếu có

4. **Sắp xếp thông minh**:
   - Sản phẩm có loại bỏ được ưu tiên hiển thị trước
   - Sau đó sắp xếp theo số lượng bán tăng dần

## Lợi ích

### **Cho Người quản lý**

- 📊 **Phân tích toàn diện**: Xem cả sản phẩm bán chậm và sản phẩm đã loại bỏ
- 🎯 **Quyết định chính xác**: Hiểu rõ sản phẩm nào có vấn đề và lý do
- 📈 **Tối ưu kho hàng**: Nhận biết pattern sản phẩm có vấn đề

### **Cho Nhân viên**

- 👁️ **Dễ nhận biết**: Badge và màu sắc giúp phát hiện nhanh
- 📋 **Thông tin chi tiết**: Biết lý do và thời gian loại bỏ
- 🔍 **Phân tích sâu**: Kết hợp dữ liệu bán hàng và loại bỏ

## Giao diện

### **Cột mới trong bảng**

```
| Tên sản phẩm | Thuộc tính | Số lượng bán | Tồn kho | Đã loại bỏ | Doanh thu | Lợi nhuận |
|--------------|------------|--------------|---------|------------|-----------|-----------|
| Áo thun 🏷️   | Đỏ - M     | 0           | 5       | 3 (15/01)  | 0 VNĐ     | 0 VNĐ     |
| Badge: "Có loại bỏ" | Lý do: Hàng hỏng |     |         |            |           |           |
```

### **Màu sắc**

- 🔴 **Đỏ**: Số lượng bán, tồn kho (vấn đề)
- 🟠 **Cam**: Số lượng đã loại bỏ (cảnh báo)
- 🏷️ **Badge đỏ**: "Có loại bỏ" (thu hút chú ý)

## Files đã thay đổi

1. **`src/components/tabs/AnalysisTab.tsx`**

   - Thêm `disposalLogEntries` prop
   - Cập nhật logic `slowSellingProducts` useMemo
   - Bổ sung thông tin disposal vào dữ liệu

2. **`src/components/analysis/SlowSellingProductsTable.tsx`**

   - Thêm cột "Đã loại bỏ"
   - Hiển thị badge và lý do loại bỏ
   - Cập nhật interface và styling

3. **`src/app/page.tsx`**
   - Truyền `filteredDisposalLogForAnalysis` vào AnalysisTab

## Kiểm thử

### **Kịch bản test**

1. Tạo một số sản phẩm trong kho
2. Loại bỏ một số sản phẩm với lý do khác nhau
3. Vào tab "Phân tích" → "Phân tích Sản phẩm"
4. Kiểm tra bảng "Top Sản phẩm Bán chậm"

### **Kết quả mong đợi**

- ✅ Sản phẩm đã loại bỏ hiển thị badge "Có loại bỏ"
- ✅ Cột "Đã loại bỏ" hiển thị số lượng và ngày
- ✅ Lý do loại bỏ hiển thị dưới thuộc tính
- ✅ Sản phẩm có loại bỏ được ưu tiên hiển thị

## Tương lai

### **Có thể mở rộng**

- 📊 **Biểu đồ disposal**: Visualize trend loại bỏ theo thời gian
- 📈 **Phân tích nguyên nhân**: Group theo lý do loại bỏ
- 💰 **Tính toán tổn thất**: Giá trị tiền tệ của sản phẩm đã loại bỏ
- 🔔 **Cảnh báo thông minh**: Alert khi sản phẩm có pattern disposal cao

## Lưu ý kỹ thuật

- Dữ liệu disposal được lọc theo cùng khoảng thời gian với filter phân tích
- Logic sắp xếp: disposal trước, sau đó theo soldInPeriod tăng dần
- Interface tương thích ngược với ProductPerformance hiện có
- Responsive design cho mobile và desktop
