# Fleur Manager - Hệ thống quản lý cửa hàng

Hệ thống quản lý cửa hàng hiện đại được xây dựng với Next.js, Firebase và Cloudinary.

## Tính năng chính

- 🛍️ **Quản lý bán hàng**: Tạo hóa đơn, quản lý giỏ hàng
- 📦 **Quản lý kho hàng**: Thêm/sửa/xóa sản phẩm với hình ảnh
- 👥 **Quản lý khách hàng**: Theo dõi thông tin và lịch sử mua hàng
- 💰 **Quản lý công nợ**: Theo dõi và xử lý các khoản nợ
- 📊 **Phân tích dữ liệu**: Dashboard với biểu đồ và thống kê
- 🏪 **Gian hàng online**: Khách hàng có thể đặt hàng trực tuyến
- 🎯 **Hệ thống điểm thưởng**: VIP tiers dựa trên tổng chi tiêu

## Công nghệ sử dụng

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Realtime Database)
- **File Upload**: Cloudinary
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Hooks, Context API

## Cài đặt và chạy

1. **Clone repository**

   ```bash
   git clone <repo-url>
   cd phienbannangcap-main
   ```

2. **Cài đặt dependencies**

   ```bash
   npm install
   ```

3. **Cấu hình Firebase**

   - Tạo project Firebase mới
   - Cấu hình Authentication và Realtime Database
   - Thêm thông tin config vào `src/lib/firebase.ts`

4. **Cấu hình Cloudinary**

   - Đăng ký tài khoản Cloudinary
   - Thêm thông tin vào `.env.local`:
     ```env
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```
   - Xem chi tiết trong [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)

5. **Chạy ứng dụng**
   ```bash
   npm run dev
   ```

## Hướng dẫn sử dụng

### Upload ảnh sản phẩm

- Hệ thống đã tích hợp Cloudinary để lưu trữ ảnh
- Hỗ trợ drag & drop, multiple uploads
- Tự động optimize và resize ảnh
- Preview ảnh real-time

### Quản lý quyền người dùng

- **Admin**: Toàn quyền quản lý
- **Manager**: Quản lý nhân viên và dữ liệu
- **Staff**: Bán hàng và quản lý kho
- **Customer**: Đặt hàng và xem lịch sử

## Tính năng mới: Cloudinary Integration

✅ **Đã hoàn thành**:

- Upload ảnh lên Cloudinary với auto-optimization
- Progress tracking khi upload
- Drag & drop interface
- Delete ảnh từ Cloudinary
- Preview ảnh với thumbnail grid
- Validation file size và format
- Server-side upload API an toàn

Xem chi tiết cách sử dụng trong [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)

## Cấu trúc project

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── ui/             # UI components (buttons, dialogs...)
│   ├── tabs/           # Tab components
│   └── products/       # Product-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities và configurations
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request
