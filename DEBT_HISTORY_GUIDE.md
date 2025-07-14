# 📋 Hướng dẫn sử dụng Lịch sử Công nợ

## 🎯 Tổng quan

Hệ thống lịch sử công nợ đã được đơn giản hóa để chỉ theo dõi 2 hành động chính:

- **Tạo nợ**: Khi khách hàng mua hàng và nợ tiền
- **Thanh toán**: Khi khách hàng thanh toán công nợ

## 🔍 Cách sử dụng

### 1. Xem lịch sử công nợ từ Tab Công nợ

1. Vào tab **"Công nợ"**
2. Tìm khách hàng cần xem lịch sử
3. Nhấn nút **"Toàn bộ LS"** (màu xám) ở cột cuối
4. Dialog lịch sử sẽ hiển thị với:
   - **Tổng quan**: Tổng nợ đã tạo, đã thanh toán, còn lại
   - **Bảng chi tiết**: Ngày, hành động, số tiền, nợ còn lại, nhân viên, ghi chú

### 2. Các loại hành động trong lịch sử

- 🔴 **Badge đỏ "Tạo nợ"**: Khách hàng mua hàng và tạo công nợ
- 🔵 **Badge xanh "Thanh toán"**: Khách hàng thanh toán công nợ

## 🔄 Tự động ghi lịch sử

### Khi nào lịch sử được ghi tự động:

1. **Tạo hóa đơn có nợ**: Tự động ghi "Tạo nợ"
2. **Nhập hàng từ nhà cung cấp**: Tự động ghi "Tạo nợ" cho nhà cung cấp
3. **Thanh toán công nợ**: Tự động ghi "Thanh toán" cho từng khoản được trả

### Thông tin được lưu:

- Tên khách hàng
- Số tiền liên quan
- Số nợ còn lại sau hành động
- Nhân viên thực hiện
- Thời gian thực hiện
- Ghi chú (nếu có)
- ID hóa đơn liên quan (nếu có)

## 💡 Lưu ý

- Lịch sử được sắp xếp theo thời gian mới nhất trước
- Dữ liệu được lưu riêng biệt trong collection `debtHistory`
- Chỉ có thể xem, không thể chỉnh sửa lịch sử
- Lịch sử được đồng bộ real-time với Firebase

## 🎨 Giao diện

- **Responsive**: Hoạt động tốt trên mobile và desktop
- **Loading state**: Hiển thị "Đang tải lịch sử..." khi load dữ liệu
- **Badge màu sắc**: Phân biệt rõ ràng các loại hành động
- **Thông tin chi tiết**: Hiển thị đầy đủ thông tin cần thiết
