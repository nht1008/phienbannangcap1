import { ref, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

/**
 * Đánh số lại lô hàng cho tất cả sản phẩm
 * Quy tắc: 
 * - Lô cũ nhất = 1, lô mới nhất = số cao nhất
 * - Chỉ xóa lô hết hàng khi nhóm sản phẩm có >= 2 lô
 * - Khi chỉ có 1 lô duy nhất, giữ lại dù hết hàng để tránh mất công thêm lại
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
    let totalKept = 0;

    // Xử lý từng nhóm sản phẩm
    for (const [groupKey, products] of productGroups) {
      const totalBatchesInGroup = products.length;
      const inStockProducts = products.filter(p => p.quantity > 0);
      const outOfStockProducts = products.filter(p => p.quantity <= 0);

      console.log(`📋 Nhóm "${products[0]?.name}": ${totalBatchesInGroup} lô (${inStockProducts.length} còn hàng, ${outOfStockProducts.length} hết hàng)`);

      // Logic mới: chỉ xóa lô hết hàng khi có >= 2 lô trong nhóm
      if (totalBatchesInGroup >= 2) {
        // Xóa sản phẩm hết hàng khi có nhiều lô
        outOfStockProducts.forEach(product => {
          updates[`inventory/${product.id}`] = null; // Xóa khỏi Firebase
          totalDeleted++;
          console.log(`🗑️  Xóa lô hết hàng: ${product.name} (Lô ${product.batchNumber || 'N/A'}) - Còn ${totalBatchesInGroup - 1} lô khác`);
        });
      } else if (totalBatchesInGroup === 1) {
        // Giữ lại lô duy nhất dù hết hàng
        outOfStockProducts.forEach(product => {
          totalKept++;
          console.log(`🔒 Giữ lại lô duy nhất: ${product.name} (Lô ${product.batchNumber || 'N/A'}) - Dù hết hàng để tránh mất công thêm lại`);
        });
      }

      if (inStockProducts.length === 0 && totalBatchesInGroup >= 2) {
        console.log(`📤 Nhóm "${groupKey}" không còn sản phẩm nào trong kho sau khi xóa`);
        continue;
      }

      // Lấy tất cả sản phẩm cần đánh số lại (bao gồm cả hết hàng nếu chỉ có 1 lô)
      const productsToReorder = totalBatchesInGroup === 1 ? products : inStockProducts;

      if (productsToReorder.length === 0) {
        continue;
      }

      // Sắp xếp sản phẩm theo batchNumber cũ (thứ tự nhập kho)
      productsToReorder.sort((a, b) => (a.batchNumber || 1) - (b.batchNumber || 1));

      // Đánh số lại từ 1
      productsToReorder.forEach((product, index) => {
        const newBatchNumber = index + 1;
        const oldBatchNumber = product.batchNumber || 1;
        
        if (oldBatchNumber !== newBatchNumber) {
          updates[`inventory/${product.id}/batchNumber`] = newBatchNumber;
          totalReordered++;
          console.log(`🔢 ${product.name}: Lô ${oldBatchNumber} → Lô ${newBatchNumber}`);
        }
      });

      console.log(`✅ Nhóm "${productsToReorder[0].name}": ${productsToReorder.length} lô đã được sắp xếp`);
    }

    // Cập nhật Firebase nếu có thay đổi
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      console.log(`🎯 Hoàn thành đánh số lại lô hàng:`);
      console.log(`   - ${totalReordered} lô đã được đánh số lại`);
      console.log(`   - ${totalDeleted} lô hết hàng đã được xóa (chỉ khi có >= 2 lô)`);
      console.log(`   - ${totalKept} lô hết hàng được giữ lại (vì là lô duy nhất)`);
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
 * Tính cả những lô hết hàng để tránh trùng batch number
 */
export function getNextBatchNumber(newProduct: Product, existingProducts: Product[]): number {
  const sameGroupProducts = existingProducts.filter(p => 
    isSameProductGroup(p, newProduct) // Bỏ điều kiện p.quantity > 0 để tính cả lô hết hàng
  );
  
  if (sameGroupProducts.length === 0) {
    return 1; // Sản phẩm đầu tiên trong nhóm
  }
  
  const maxBatch = Math.max(...sameGroupProducts.map(p => p.batchNumber || 1));
  return maxBatch + 1;
}
