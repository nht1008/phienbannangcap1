import type { Product } from '@/types';

/**
 * Lấy URL ảnh đại diện cho sản phẩm
 * Ưu tiên: thumbnailImage của sản phẩm hiện tại > thumbnailImage của sản phẩm cùng tên > placeholder (KHÔNG dùng images[0])
 */
export const getProductThumbnail = (product: Product, allProducts?: Product[]): string => {
  // Ưu tiên thumbnail đã được set cho sản phẩm hiện tại
  if (product.thumbnailImage && product.thumbnailImage.trim() !== '') {
    return product.thumbnailImage;
  }
  
  // Nếu có danh sách sản phẩm, tìm thumbnail từ sản phẩm cùng tên
  if (allProducts && allProducts.length > 0) {
    const productWithSameName = allProducts.find(p => 
      p.name === product.name && 
      p.id !== product.id && 
      p.thumbnailImage && 
      p.thumbnailImage.trim() !== ''
    );
    
    if (productWithSameName?.thumbnailImage) {
      return productWithSameName.thumbnailImage;
    }
  }
  
  // Trả về placeholder thay vì dùng images[0]
  return 'https://placehold.co/400x400.png?text=No+Image';
};

/**
 * Lấy URL ảnh đại diện cho sản phẩm (version cũ để tương thích ngược)
 */
export const getProductThumbnailSimple = (product: Product): string => {
  return getProductThumbnail(product);
};

/**
 * Kiểm tra xem sản phẩm có ảnh đại diện tùy chỉnh không
 */
export const hasCustomThumbnail = (product: Product): boolean => {
  return !!(product.thumbnailImage && product.thumbnailImage.trim() !== '');
};

/**
 * Tạo URL ảnh đại diện với size cụ thể (dành cho Cloudinary)
 */
export const getProductThumbnailWithSize = (product: Product, width: number = 400, height: number = 400): string => {
  const thumbnailUrl = getProductThumbnail(product);
  
  // Nếu là Cloudinary URL, thêm transformation
  if (thumbnailUrl.includes('cloudinary.com')) {
    // Tìm vị trí insert transformation
    const uploadIndex = thumbnailUrl.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const transformation = `c_fill,w_${width},h_${height},q_auto,f_webp/`;
      return thumbnailUrl.slice(0, uploadIndex + 8) + transformation + thumbnailUrl.slice(uploadIndex + 8);
    }
  }
  
  return thumbnailUrl;
};

/**
 * Kiểm tra xem sản phẩm có ảnh đại diện riêng không (không tính từ sản phẩm cùng tên)
 */
export const hasOwnThumbnail = (product: Product): boolean => {
  return !!(product.thumbnailImage && product.thumbnailImage.trim() !== '');
};

/**
 * Kiểm tra xem nhóm sản phẩm cùng tên đã có ảnh đại diện chưa
 */
export const hasGroupThumbnail = (product: Product, allProducts: Product[]): boolean => {
  return allProducts.some(p => 
    p.name === product.name && 
    p.thumbnailImage && 
    p.thumbnailImage.trim() !== ''
  );
};

/**
 * Kiểm tra xem sản phẩm có thể upload thumbnail không
 * - Sản phẩm chưa có thumbnail riêng: có thể upload
 * - Sản phẩm có thumbnail riêng: có thể upload (thay đổi)
 * - Sản phẩm không có thumbnail nhưng nhóm đã có: không thể upload
 */
export const canUploadThumbnail = (product: Product, allProducts: Product[]): boolean => {
  const hasOwn = hasOwnThumbnail(product);
  const hasGroup = hasGroupThumbnail(product, allProducts);
  
  // Nếu sản phẩm đã có thumbnail riêng, luôn có thể thay đổi
  if (hasOwn) return true;
  
  // Nếu sản phẩm chưa có thumbnail riêng nhưng nhóm đã có, không thể upload
  if (!hasOwn && hasGroup) return false;
  
  // Nếu cả sản phẩm và nhóm đều chưa có thumbnail, có thể upload
  return true;
};
