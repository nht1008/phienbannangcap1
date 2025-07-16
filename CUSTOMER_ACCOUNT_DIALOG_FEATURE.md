# Chức năng Thông tin Tài khoản Khách hàng

## Tổng quan

Đã thêm dialog thông tin tài khoản cho khách hàng với các chức năng:

- ✅ Xem thông tin cá nhân và hạng VIP
- ✅ Đổi mật khẩu
- ✅ Tải ảnh đại diện lên
- ✅ Cập nhật tên hiển thị

## Vị trí tích hợp

Chức năng được tích hợp vào `CustomerCartSheet` - giao diện giỏ hàng của khách hàng.

### Cách truy cập

1. Khách hàng mở giỏ hàng
2. Nhấn nút **"Tài khoản"** ở góc phải trên header
3. Dialog thông tin tài khoản sẽ mở ra

## Các tab chức năng

### 1. Tab "Thông tin cá nhân"

**Hiển thị:**

- Avatar hiện tại
- Tên khách hàng từ database
- Email đăng nhập
- Hạng VIP (nếu có)
- Số điện thoại
- Tên Zalo
- Địa chỉ

**Chức năng:**

- Cập nhật tên hiển thị (Firebase Auth displayName)

### 2. Tab "Ảnh đại diện"

**Chức năng:**

- Hiển thị avatar hiện tại
- Drag & drop upload ảnh mới
- Click để chọn file
- Preview ảnh trước khi upload
- Tự động resize và optimize ảnh qua Cloudinary

**Giới hạn:**

- Chỉ accept file image/\*
- Tối đa 5MB
- Tự động convert sang WebP

**Lưu trữ:**

- Upload lên Cloudinary folder: `customer-avatars`
- Cập nhật Firebase Auth `photoURL`

### 3. Tab "Bảo mật"

**Chức năng đổi mật khẩu:**

- Nhập mật khẩu hiện tại
- Nhập mật khẩu mới (tối thiểu 6 ký tự)
- Xác nhận mật khẩu mới
- Toggle hiển thị/ẩn mật khẩu

**Xử lý lỗi:**

- `auth/requires-recent-login`: Yêu cầu đăng nhập lại
- `auth/weak-password`: Mật khẩu quá yếu
- Validation form đầy đủ

## Components

### CustomerAccountDialog

**Location:** `src/components/customer/CustomerAccountDialog.tsx`

**Props:**

```typescript
interface CustomerAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string;
  onProfileUpdate?: (name: string, photoURL: string) => void;
}
```

**Dependencies:**

- `@/hooks/use-cloudinary-upload` - Upload ảnh
- `firebase/auth` - Authentication functions
- `@/components/ui/*` - UI components

## Cập nhật CustomerCartSheet

**Changes:**

- Import `CustomerAccountDialog` và `useAuth`
- Thêm state `isAccountDialogOpen`
- Thêm nút "Tài khoản" ở header
- Thêm dialog component ở cuối

**Code thêm vào:**

```tsx
// State
const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
const { currentUser } = useAuth();

// UI Button
<Button
  variant="outline"
  size="sm"
  onClick={() => setIsAccountDialogOpen(true)}
  className="flex items-center gap-2 h-8 text-xs"
>
  <User className="h-3 w-3" />
  <span className="hidden sm:inline">Tài khoản</span>
</Button>;
```

## API sử dụng

### Cloudinary Upload

- **Endpoint:** `/api/cloudinary-upload`
- **Method:** POST
- **Body:** FormData với file và folder
- **Folder:** `customer-avatars`

### Firebase Auth

- `updateProfile()` - Cập nhật displayName và photoURL
- `updatePassword()` - Đổi mật khẩu

## Responsive Design

- **Mobile:** Tab navigation dọc, UI thu gọn
- **Desktop:** Tab navigation ngang, UI rộng rãi
- **Drag & Drop:** Hoạt động trên cả mobile và desktop

## Security

- Avatar upload qua Cloudinary với validation
- Password change với proper error handling
- Chỉ user đã đăng nhập mới truy cập được
- Validation đầy đủ ở cả client và server

## Testing

### Scenarios cần test

1. **Happy Path:**

   - Mở dialog từ cart
   - Navigate giữa các tab
   - Upload avatar thành công
   - Đổi mật khẩu thành công
   - Cập nhật tên hiển thị

2. **Error Cases:**

   - Upload file quá lớn
   - Upload file không phải ảnh
   - Đổi mật khẩu với mật khẩu hiện tại sai
   - Mật khẩu mới quá yếu
   - Mất kết nối internet

3. **Edge Cases:**
   - Đóng dialog khi đang upload
   - Multiple clicks rapid
   - Long file names
   - Special characters trong tên file

## Future Enhancements

- Real-time avatar update trong app
- Crop ảnh trước khi upload
- Upload multiple ảnh cùng lúc
- 2FA enable/disable
- Activity log cho security
- Integration với customer data update
