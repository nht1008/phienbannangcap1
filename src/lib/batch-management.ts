import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

/**
 * Đánh số lại lô hàng cho tất cả sản phẩm
 * Quy tắc: Lô cũ nhất = 1, lô mới nhất = số cao nhất
 * Xóa những lô hết hàng (quantity = 0)
 */
export async function reorderBatchNumbers(): Promise<void> {
  try {
    console.log('🔄 Bắt đầu đánh số lại lô hàng...');
    
    // Lấy tất cả sản phẩm từ Firebase
    const inventorySnapshot = await get(ref(db, 'inventory'));
    if (!inventorySnapshot.exists()) {
      console.log('📦 Không có sản phẩm nào trong kho');
      return;
    }

    const allProducts: Record<string, Product> = inventorySnapshot.val();
    const productsArray = Object.entries(allProducts).map(([id, product]) => ({
      ...product,
      id
    }));

    console.log(`📦 Tìm thấy ${productsArray.length} sản phẩm`);

    // Nhóm sản phẩm theo các thuộc tính (name + color + quality + size + unit)
    const productGroups = new Map<string, Product[]>();
    
    productsArray.forEach(product => {
      // Tạo key nhóm từ các thuộc tính
      const groupKey = [
        product.name,
        product.color || '',
        product.quality || '', 
        product.size || '',
        product.unit || ''
      ].join('|').toLowerCase();

      if (!productGroups.has(groupKey)) {
        productGroups.set(groupKey, []);
      }
      productGroups.get(groupKey)!.push(product);
    });

    console.log(`📊 Tìm thấy ${productGroups.size} nhóm sản phẩm`);

    const updates: { [key: string]: any } = {};
    let totalReordered = 0;
    let totalDeleted = 0;

    // Xử lý từng nhóm sản phẩm
    for (const [groupKey, products] of productGroups) {
      // Lọc bỏ sản phẩm hết hàng
      const inStockProducts = products.filter(p => p.quantity > 0);
      const outOfStockProducts = products.filter(p => p.quantity <= 0);

      // Xóa sản phẩm hết hàng
      outOfStockProducts.forEach(product => {
        updates[`inventory/${product.id}`] = null; // Xóa khỏi Firebase
        totalDeleted++;
        console.log(`🗑️  Xóa sản phẩm hết hàng: ${product.name} (Lô ${product.batchNumber || 'N/A'})`);
      });

      if (inStockProducts.length === 0) {
        console.log(`📤 Nhóm "${groupKey}" không còn sản phẩm nào trong kho`);
        continue;
      }

      // Sắp xếp sản phẩm còn hàng theo batchNumber cũ (thứ tự nhập kho)
      inStockProducts.sort((a, b) => (a.batchNumber || 1) - (b.batchNumber || 1));

      // Đánh số lại từ 1
      inStockProducts.forEach((product, index) => {
        const newBatchNumber = index + 1;
        const oldBatchNumber = product.batchNumber || 1;
        
        if (oldBatchNumber !== newBatchNumber) {
          updates[`inventory/${product.id}/batchNumber`] = newBatchNumber;
          totalReordered++;
          console.log(`🔢 ${product.name}: Lô ${oldBatchNumber} → Lô ${newBatchNumber}`);
        }
      });

      console.log(`✅ Nhóm "${inStockProducts[0].name}": ${inStockProducts.length} lô đã được sắp xếp`);
    }

    // Cập nhật Firebase nếu có thay đổi
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      console.log(`🎯 Hoàn thành đánh số lại lô hàng:`);
      console.log(`   - ${totalReordered} lô đã được đánh số lại`);
      console.log(`   - ${totalDeleted} sản phẩm hết hàng đã được xóa`);
    } else {
      console.log('✨ Không cần thay đổi gì, tất cả lô hàng đã đúng thứ tự');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi đánh số lại lô hàng:', error);
    throw error;
  }
}

/**
 * Normalize thuộc tính sản phẩm để so sánh
 */
function normalizeAttribute(attr: string | undefined): string {
  return (attr || '').trim().toLowerCase();
}

/**
 * Kiểm tra hai sản phẩm có cùng thuộc tính không
 */
export function isSameProductGroup(product1: Product, product2: Product): boolean {
  return (
    normalizeAttribute(product1.name) === normalizeAttribute(product2.name) &&
    normalizeAttribute(product1.color) === normalizeAttribute(product2.color) &&
    normalizeAttribute(product1.quality) === normalizeAttribute(product2.quality) &&
    normalizeAttribute(product1.size) === normalizeAttribute(product2.size) &&
    normalizeAttribute(product1.unit) === normalizeAttribute(product2.unit)
  );
}

/**
 * Lấy số lô tiếp theo cho sản phẩm mới
 */
export function getNextBatchNumber(newProduct: Product, existingProducts: Product[]): number {
  const sameGroupProducts = existingProducts.filter(p => 
    isSameProductGroup(p, newProduct) && p.quantity > 0
  );
  
  if (sameGroupProducts.length === 0) {
    return 1; // Sản phẩm đầu tiên trong nhóm
  }
  
  const maxBatch = Math.max(...sameGroupProducts.map(p => p.batchNumber || 1));
  return maxBatch + 1;
}
