# Hướng dẫn tích hợp Cloudinary

## 1. Đăng ký tài khoản Cloudinary

1. Truy cập [cloudinary.com](https://cloudinary.com)
2. Đăng ký tài khoản miễn phí
3. Sau khi đăng ký, bạn sẽ có Dashboard với thông tin:
   - Cloud Name
   - API Key
   - API Secret

## 2. Cấu hình biến môi trường

Cập nhật file `.env.local` với thông tin từ Cloudinary Dashboard:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## 3. Tạo Upload Preset (Tùy chọn)

1. Vào Cloudinary Dashboard
2. Chọn Settings > Upload
3. Tạo một Upload Preset mới:
   - Preset name: `fleur-manager-preset`
   - Signing Mode: `Unsigned` (để upload từ client-side)
   - Folder: `fleur-manager`
   - Transformations:
     - Width: 800, Height: 800, Crop: limit
     - Quality: auto:good
     - Format: webp

## 4. Cách sử dụng

### Trong ProductFormDialog

Component `ProductFormDialog` đã được tích hợp sẵn với `ImageUpload` component để:

- Upload ảnh lên Cloudinary
- Hiển thị preview ảnh
- Xóa ảnh khỏi Cloudinary
- Tự động resize và optimize ảnh

### Sử dụng ImageUpload component độc lập

```tsx
import { ImageUpload } from "@/components/ui/image-upload";

function MyComponent() {
  const [images, setImages] = useState([]);

  const handleImageUploaded = (url: string, publicId: string) => {
    setImages((prev) => [...prev, { url, publicId }]);
  };

  const handleImageRemoved = (publicId: string) => {
    setImages((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  return (
    <ImageUpload
      onImageUploaded={handleImageUploaded}
      onImageRemoved={handleImageRemoved}
      folder="my-folder"
      maxImages={5}
      currentImages={images}
    />
  );
}
```

### Sử dụng hook useCloudinaryUpload

```tsx
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";

function MyComponent() {
  const { uploadImage, deleteImage, isUploading, uploadProgress } =
    useCloudinaryUpload();

  const handleFileSelect = async (file: File) => {
    const result = await uploadImage(file, "my-folder");
    if (result) {
      console.log("Uploaded:", result.url);
    }
  };

  const handleDelete = async (publicId: string) => {
    const success = await deleteImage(publicId);
    if (success) {
      console.log("Deleted successfully");
    }
  };

  return (
    <div>
      {isUploading && <div>Uploading... {uploadProgress}%</div>}
      {/* Your UI here */}
    </div>
  );
}
```

## 5. Features

- ✅ Drag & drop upload
- ✅ Multiple file upload
- ✅ Auto image optimization (resize, format conversion)
- ✅ Progress tracking
- ✅ File validation (size, type)
- ✅ Preview với thumbnail grid
- ✅ Delete images
- ✅ Server-side upload API
- ✅ TypeScript support

## 6. Lưu ý bảo mật

- API Secret chỉ dùng ở server-side
- Client-side chỉ sử dụng Cloud Name và Upload Preset
- Unsigned uploads có thể bị giới hạn, cân nhắc sử dụng signed uploads cho production

## 7. Giới hạn tài khoản miễn phí

- 25 GB storage
- 25 GB bandwidth/tháng
- 1000 transformations/tháng

## 8. Troubleshooting

### Lỗi "Upload failed"

- Kiểm tra Cloud Name trong .env.local
- Kiểm tra Upload Preset nếu sử dụng
- Kiểm tra file size và format

### Lỗi "Delete failed"

- Kiểm tra API Secret trong .env.local
- Kiểm tra public_id có đúng không
