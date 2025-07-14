# Tính năng Hình đại diện sản phẩm (Product Thumbnail Feature)

## Tổng quan

Tính năng này cho phép mỗi sản phẩm có hình đại diện riêng biệt ở tab bán hàng và gian hàng. Khi nhấn vào ảnh đại diện, người dùng có thể xem và chọn hình ảnh theo thuộc tính sản phẩm khác nhau.

## Các thành phần đã thêm

### 1. ThumbnailSelector Component

**Vị trí:** `src/components/shared/ThumbnailSelector.tsx`

Đây là dialog component cho phép:

- Chọn thuộc tính sản phẩm (màu sắc, chất lượng, kích thước, đơn vị)
- Xem trước hình ảnh tương ứng với thuộc tính đã chọn
- Chọn hình ảnh cụ thể từ gallery của variant
- Xem trước kết quả trước khi xác nhận

**Tính năng chính:**

- Giao diện trực quan với card selection cho các variants
- Carousel hiển thị hình ảnh với navigation
- Grid thumbnails để chọn hình ảnh cụ thể
- Preview section để xem kết quả cuối cùng

### 2. useThumbnailSelector Hook

**Vị trí:** `src/hooks/use-thumbnail-selector.ts`

Custom hook để quản lý state của thumbnail selector:

```typescript
interface ThumbnailState {
  isOpen: boolean;
  productName: string;
  products: Product[];
  selectedProduct: Product | null;
}
```

### 3. Cập nhật Product Type

**Vị trí:** `src/types/index.ts`

Thêm thuộc tính `thumbnailImage?` vào interface Product:

```typescript
export interface Product {
  // ...existing properties
  thumbnailImage?: string; // Hình đại diện được chọn cho sản phẩm này
}
```

## Cách hoạt động

### Tab Bán hàng (SalesTab)

1. **Hiển thị hình đại diện:** Mỗi card sản phẩm sử dụng `getProductThumbnail()` để hiển thị:

   - `product.thumbnailImage` nếu đã được set
   - `product.images[0]` nếu chưa có thumbnail
   - Placeholder image nếu không có hình nào

2. **Button chọn thumbnail:** Khi hover vào card sản phẩm, hiện button với icon `ImageIcon`

   - Chỉ hiển thị nếu có prop `onUpdateThumbnail`
   - Click vào button sẽ mở ThumbnailSelector

3. **Xử lý selection:**
   ```typescript
   const handleThumbnailSelect = async (
     productId: string,
     thumbnailIndex: number
   ) => {
     // Gọi API để cập nhật thumbnail image
     await onUpdateThumbnail(productId, product.images[thumbnailIndex]);
   };
   ```

### Tab Gian hàng (StorefrontTab)

Hoạt động tương tự SalesTab với một số điểm khác biệt:

- Button thumbnail ở góc trái trên (left-2) thay vì góc phải
- Chỉ admin mới thấy button (hasFullAccessRights)
- Tích hợp với ProductCard component

## API Integration

### Props mới cần thêm

```typescript
// Cho SalesTab và StorefrontTab
onUpdateThumbnail?: (productId: string, thumbnailImage: string) => Promise<void>;
```

### Ví dụ implementation trong parent component:

```typescript
const handleUpdateThumbnail = async (
  productId: string,
  thumbnailImage: string
) => {
  try {
    // Cập nhật database
    await updateProductThumbnail(productId, thumbnailImage);

    // Cập nhật local state
    setInventory((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, thumbnailImage } : product
      )
    );
  } catch (error) {
    console.error("Failed to update thumbnail:", error);
    throw error;
  }
};
```

## UX/UI Improvements

### Visual Feedback

- Toast notifications cho thành công/lỗi
- Loading states trong quá trình cập nhật
- Hover effects cho interactive elements
- Badge indicators cho selected items

### Responsive Design

- Grid layout adaptive theo screen size
- Touch-friendly buttons cho mobile
- Optimal image sizing với proper aspect ratios

### Accessibility

- Proper alt texts cho images
- Keyboard navigation support
- Screen reader friendly labels
- Focus management trong dialogs

## Lợi ích

1. **Trải nghiệm người dùng tốt hơn:**

   - Mỗi sản phẩm có hình đại diện rõ ràng
   - Dễ dàng phân biệt các variants
   - Xem trước hình ảnh theo thuộc tính

2. **Quản lý linh hoạt:**

   - Admin có thể tùy chỉnh hình đại diện
   - Không bị giới hạn bởi thứ tự hình ảnh trong array
   - Có thể chọn hình phù hợp nhất cho từng variant

3. **Hiệu suất tốt:**
   - Lazy loading cho images
   - Caching với proper error handling
   - Minimal re-renders với proper memoization

## Cách sử dụng

1. **Để enable tính năng:** Truyền prop `onUpdateThumbnail` vào SalesTab/StorefrontTab
2. **Để chọn thumbnail:** Click vào button ImageIcon trên card sản phẩm
3. **Trong dialog:** Chọn variant và hình ảnh mong muốn, sau đó click "Chọn làm ảnh đại diện"
4. **Kết quả:** Hình đại diện được cập nhật ngay lập tức trong UI

## Note for Developers

- Đảm bảo API endpoint `/api/update-product-thumbnail` được implement
- Database schema cần có column `thumbnailImage` trong product table
- Error handling phải robust để xử lý các trường hợp network failure
- Consider implementing thumbnail optimization/resizing để improve performance
