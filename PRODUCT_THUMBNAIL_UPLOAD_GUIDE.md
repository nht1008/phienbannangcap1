# Tính năng Tải ảnh đại diện sản phẩm

## Tổng quan

Tính năng này cho phép quản lý viên upload và quản lý ảnh đại diện riêng biệt cho từng sản phẩm trong danh sách tất cả sản phẩm. Ảnh đại diện này sẽ được ưu tiên hiển thị thay cho ảnh đầu tiên trong gallery ở tab Bán hàng và tab Gian hàng.

## Cách hoạt động

### 1. Truy cập tính năng

1. Mở ứng dụng Fleur Manager
2. Chuyển đến tab **"Kho hàng"**
3. Trong danh sách tất cả sản phẩm, tại cột **"Ảnh đại diện"**, bạn sẽ thấy:
   - Ảnh hiện tại của sản phẩm (ảnh đại diện hoặc ảnh đầu tiên)
   - Nút **"Thêm"** (nếu chưa có ảnh đại diện) hoặc **"Đổi"** (nếu đã có)

### 2. Tải lên ảnh đại diện mới

1. Click vào nút **"Thêm"** hoặc **"Đổi"**
2. Dialog upload sẽ hiện ra với:
   - Hiển thị ảnh đại diện hiện tại (nếu có)
   - Khu vực kéo thả để upload ảnh mới
3. Bạn có thể:
   - **Kéo thả** ảnh từ máy tính vào khu vực upload
   - **Click** vào khu vực upload để chọn file
4. Sau khi chọn ảnh:
   - Ảnh sẽ được tải lên Cloudinary
   - Database sẽ được cập nhật tự động
   - Thông báo thành công sẽ hiện ra

### 3. Xóa ảnh đại diện

1. Trong dialog upload, nếu đã có ảnh đại diện
2. Click vào nút **"X"** ở góc phải trên ảnh
3. Ảnh đại diện sẽ bị xóa và sản phẩm sẽ hiển thị ảnh đầu tiên từ gallery

## Ưu tiên hiển thị

Hệ thống sẽ hiển thị ảnh theo thứ tự ưu tiên sau:

1. **Ảnh đại diện tùy chỉnh** (thumbnailImage) - nếu đã được upload
2. **Ảnh đầu tiên trong gallery** (images[0]) - nếu có ảnh trong gallery
3. **Placeholder mặc định** - nếu không có ảnh nào

## Nơi ảnh đại diện được hiển thị

Ảnh đại diện sẽ được sử dụng ở:

- **Tab Bán hàng**: Trong danh sách sản phẩm để chọn bán
- **Tab Gian hàng**: Trong showcase sản phẩm cho khách hàng
- **Tab Kho hàng**: Trong danh sách quản lý sản phẩm

## Yêu cầu kỹ thuật

### Định dạng file

- **Hỗ trợ**: JPG, PNG, WEBP
- **Kích thước tối đa**: 10MB
- **Tự động tối ưu**: Ảnh sẽ được tự động resize và compress

### Lưu trữ

- **Cloudinary**: Ảnh được lưu trữ trên Cloudinary với auto-optimization
- **Database**: URL ảnh được lưu trong field `thumbnailImage` của mỗi sản phẩm

## API Endpoints

### Cập nhật ảnh đại diện

```
PATCH /api/products/update-thumbnail
```

**Body:**

```json
{
  "productId": "string",
  "thumbnailImage": "string" // URL của ảnh hoặc "" để xóa
}
```

**Response:**

```json
{
  "success": true,
  "message": "Thumbnail updated successfully"
}
```

## Quyền truy cập

- Chỉ **quản lý viên có quyền đầy đủ** mới có thể upload/thay đổi ảnh đại diện
- Nhân viên thường và khách hàng chỉ có thể xem

## Lợi ích

1. **Kiểm soát hiển thị**: Chọn ảnh tốt nhất để đại diện cho sản phẩm
2. **Trải nghiệm nhất quán**: Ảnh đại diện được hiển thị đồng nhất across tabs
3. **Tối ưu hóa**: Cloudinary tự động tối ưu ảnh cho web
4. **Dễ quản lý**: Upload trực tiếp từ giao diện quản lý

## Lưu ý

- Ảnh đại diện là riêng biệt với gallery ảnh sản phẩm
- Khi click vào sản phẩm ở tab Bán hàng/Gian hàng, vẫn sẽ hiển thị full gallery theo logic cũ
- Nếu xóa ảnh đại diện, hệ thống sẽ tự động fallback về ảnh đầu tiên trong gallery
