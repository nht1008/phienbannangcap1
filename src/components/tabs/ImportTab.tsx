"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Product } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getNextBatchNumber as getBatchNumber } from '@/lib/batch-management';
import { Trash2, AlertTriangle } from 'lucide-react';
import { EmptyBoxIllustration } from '@/components/illustrations/EmptyBoxIllustration';
import { ImportIcon } from '@/components/icons/ImportIcon';

const createNewImportItem = (): LocalItemToImport => ({
    key: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    selectedProductId: null,
    productDetails: null,
    quantity: 0,
    cost: 0,
    price: 0, // Giá bán mới
    batchNumber: 1, // Số lô hàng mặc định
    error: undefined,
    name: '',
    color: '',
    quality: 'none',
    size: '',
    unit: '',
});

interface LocalItemToImport {
    key: string;
    selectedProductId: string | null;
    productDetails: Product | null;
    name: string;
    color: string;
    quality: string | undefined;
    size: string;
    unit: string;
    quantity: number;
    cost: number;
    price: number; // Giá bán mới
    batchNumber: number; // Số lô hàng
    error?: string;
    hasPriceConflict?: boolean;
    priceAction?: 'keep' | 'update';
}

interface ImportTabProps {
    inventory: Product[];
    onImportProducts: (
        supplierName: string | undefined,
        itemsToSubmit: {
            productId: string;
            quantity: number;
            costPriceVND: number;
            salePriceVND: number; // Thêm giá bán
            batchNumber: number; // Thêm số lô hàng
            priceAction?: 'keep' | 'update';
        }[],
        totalCostVND: number,
        employeeId: string,
        employeeName: string
    ) => Promise<boolean>;
    currentUser: User | null;
}

export function ImportTab({
    inventory,
    onImportProducts,
    currentUser,
}: ImportTabProps) {
    const { toast } = useToast();
    
    // Helper function to get next batch number for a specific product
    const getNextBatchNumber = useCallback((productName: string, color: string, quality?: string, size?: string, unit?: string) => {
        console.log('🔍 getNextBatchNumber called with:', { 
            productName, 
            color, 
            quality, 
            size, 
            unit,
            inventorySize: inventory.length 
        });

        // Tìm các sản phẩm có cùng tên và thuộc tính (KHÔNG phụ thuộc vào quantity)
        const normalizedQuality = quality === 'none' || !quality ? undefined : quality;
        const matchingProducts = inventory.filter(p => {
            const productQuality = p.quality === 'none' || !p.quality ? undefined : p.quality;
            
            const isMatch = p.name === productName &&
                p.color === color &&
                productQuality === normalizedQuality &&
                p.size === (size || '') &&
                p.unit === (unit || '');
            
            console.log('🔍 Checking product:', {
                productId: p.id,
                productName: p.name,
                productColor: p.color,
                productQuality,
                productSize: p.size,
                productUnit: p.unit,
                targetName: productName,
                targetColor: color,
                targetQuality: normalizedQuality,
                targetSize: size || '',
                targetUnit: unit || '',
                isMatch
            });
            
            return isMatch;
        });

        console.log('🔍 Found matching products:', matchingProducts.length, matchingProducts.map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            quality: p.quality,
            size: p.size,
            unit: p.unit,
            batchNumber: p.batchNumber,
            quantity: p.quantity
        })));

        if (matchingProducts.length === 0) {
            console.log('✅ No matching products found - returning batch 1 for new product');
            return 1; // Sản phẩm hoàn toàn mới, bắt đầu từ lô 1
        }

        // Lấy batch number cao nhất từ TẤT CẢ sản phẩm cùng loại và cộng 1
        const existingBatchNumbers = matchingProducts
            .map(p => p.batchNumber || 1)
            .filter(batch => batch > 0);
        
        const maxBatch = Math.max(...existingBatchNumbers);
        const nextBatch = maxBatch + 1;
        
        console.log('✅ Found existing batches:', existingBatchNumbers, 'Max:', maxBatch, 'Next:', nextBatch);
        
        return nextBatch;
    }, [inventory]);
    
    const createNewItem = useCallback(() => {
        const newItem = createNewImportItem();
        // Batch number sẽ được tự động tính khi chọn sản phẩm
        return newItem;
    }, []);

    const [itemsToImport, setItemsToImport] = useState<LocalItemToImport[]>(() => [
        createNewItem()
    ]);

    const [showPriceConflictDialog, setShowPriceConflictDialog] = useState(false);
    const [conflictItem, setConflictItem] = useState<LocalItemToImport | null>(null);

    // Helper function để lấy options sẵn có cho sản phẩm
    const getAvailableOptionsForProduct = (name: string, color: string = '', quality: string = '', size: string = '') => {
        const filtered = inventory.filter(p => {
            if (!name) return false;
            if (p.name !== name) return false;
            if (color && p.color !== color) return false;
            if (quality && quality !== 'none' && p.quality !== quality) return false;
            if (size && p.size !== size) return false;
            return true;
        });

        return {
            colors: [...new Set(filtered.map(p => p.color))].filter(c => c && c.trim() !== '') as string[],
            qualities: [...new Set(filtered.map(p => p.quality))].filter(q => q && q.trim() !== '' && q !== 'none') as string[],
            sizes: [...new Set(filtered.map(p => p.size))].filter(s => s && s.trim() !== '') as string[],
            units: [...new Set(filtered.map(p => p.unit))].filter(u => u && u.trim() !== '') as string[],
        };
    };

    const handleItemChange = (index: number, field: keyof LocalItemToImport, value: any) => {
      setItemsToImport(prevItems =>
          prevItems.map((item, i) => {
              if (i === index) {
                  const updatedItem = { ...item, [field]: value };

                  // Logic từng bước như DisposalTab
                  if (field === 'name') {
                      // Reset tất cả khi chọn tên sản phẩm
                      updatedItem.color = '';
                      updatedItem.quality = undefined;
                      updatedItem.size = '';
                      updatedItem.unit = '';
                      updatedItem.productDetails = null;
                      updatedItem.selectedProductId = null;
                      updatedItem.error = undefined;
                      updatedItem.cost = 0;
                      updatedItem.price = 0;
                      return updatedItem;
                  }

                  if (field === 'color') {
                      // Reset các bước sau khi chọn màu, NHƯNG CỐ GẮNG TÌM SẢN PHẨM
                      updatedItem.quality = undefined;
                      updatedItem.size = '';
                      updatedItem.unit = '';
                      
                      // Thử tìm sản phẩm với chỉ tên và màu
                      const { name, color } = updatedItem;
                      if (name && color) {
                          const matchedProduct = inventory.find(p => 
                              p.name === name && 
                              p.color === color &&
                              (!p.quality || p.quality === 'none') &&
                              (!p.size || p.size === '') &&
                              p.unit
                          );
                          
                          if (matchedProduct) {
                              updatedItem.productDetails = matchedProduct;
                              updatedItem.selectedProductId = matchedProduct.id;
                              updatedItem.unit = matchedProduct.unit;
                              updatedItem.size = matchedProduct.size || '';
                              updatedItem.quality = matchedProduct.quality || undefined;
                              const currentCostPrice = matchedProduct.costPrice ? matchedProduct.costPrice / 1000 : 0;
                              updatedItem.cost = currentCostPrice;
                              // KHÔNG tự động set giá bán - để người dùng tự do nhập
                              // updatedItem.price = matchedProduct.price || 0;
                              updatedItem.error = undefined;
                              
                              // Tự động set batch number cho sản phẩm này - LUÔN LÀ LÔ MỚI
                              updatedItem.batchNumber = getNextBatchNumber(name, color, undefined, matchedProduct.size || '', matchedProduct.unit);
                          } else {
                              updatedItem.productDetails = null;
                              updatedItem.selectedProductId = null;
                              updatedItem.error = undefined;
                              updatedItem.cost = 0;
                              updatedItem.price = 0;
                          }
                      }
                      return updatedItem;
                  }

                  if (field === 'quality') {
                      // Reset các bước sau khi chọn quality
                      updatedItem.size = '';
                      updatedItem.unit = '';
                      updatedItem.productDetails = null;
                      updatedItem.selectedProductId = null;
                      updatedItem.error = undefined;
                      updatedItem.cost = 0;
                      updatedItem.price = 0;
                      return updatedItem;
                  }

                  if (field === 'size') {
                      // Reset các bước sau khi chọn size
                      updatedItem.unit = '';
                      updatedItem.productDetails = null;
                      updatedItem.selectedProductId = null;
                      updatedItem.error = undefined;
                      updatedItem.cost = 0;
                      updatedItem.price = 0;
                      return updatedItem;
                  }

                  if (field === 'unit') {
                      // Khi chọn đơn vị, tìm sản phẩm và kiểm tra giá
                      const { name, color, quality, size, unit } = updatedItem;
                      const normalizedQuality = quality === 'none' ? undefined : quality;

                      // Kiểm tra duplicate trong itemsToImport
                      const isDuplicate = prevItems.some((otherItem, otherIndex) => {
                          if (otherIndex === i) return false;
                          
                          const otherQuality = otherItem.quality === 'none' || !otherItem.quality ? undefined : otherItem.quality;
                          const currentQuality = normalizedQuality === 'none' || !normalizedQuality ? undefined : normalizedQuality;
                          
                          return otherItem.name === name &&
                              otherItem.color === color &&
                              otherQuality === currentQuality &&
                              otherItem.size === size &&
                              otherItem.unit === unit;
                      });

                      if (isDuplicate) {
                          updatedItem.error = 'Sản phẩm này đã được chọn ở dòng khác.';
                          updatedItem.productDetails = null;
                          updatedItem.selectedProductId = null;
                          updatedItem.cost = 0;
                          updatedItem.price = 0;
                          return updatedItem;
                      }

                      const matchedProduct = inventory.find(p => {
                          const productQuality = p.quality === 'none' || !p.quality ? undefined : p.quality;
                          const itemQuality = normalizedQuality === 'none' || !normalizedQuality ? undefined : normalizedQuality;
                          
                          return p.name === name &&
                              p.color === color &&
                              productQuality === itemQuality &&
                              p.size === size &&
                              p.unit === unit;
                      });

                      if (matchedProduct) {
                          updatedItem.productDetails = matchedProduct;
                          updatedItem.selectedProductId = matchedProduct.id;
                          const currentCostPrice = matchedProduct.costPrice ? matchedProduct.costPrice / 1000 : 0;
                          updatedItem.cost = currentCostPrice;
                          // KHÔNG tự động set giá bán - để người dùng tự do nhập
                          // updatedItem.price = matchedProduct.price || 0;
                          updatedItem.error = undefined;
                          updatedItem.hasPriceConflict = false;
                          updatedItem.priceAction = 'keep';
                          
                          // Tự động cập nhật batch number cho sản phẩm cụ thể này - LUÔN LÀ LÔ MỚI
                          updatedItem.batchNumber = getNextBatchNumber(name, color, normalizedQuality, size, unit);
                      } else {
                          updatedItem.error = 'Sản phẩm với thuộc tính này không tồn tại.';
                          updatedItem.productDetails = null;
                          updatedItem.selectedProductId = null;
                          updatedItem.cost = 0;
                          updatedItem.price = 0;
                      }
                      return updatedItem;
                  }

                  if (field === 'quantity') {
                      const newQuantity = value === '' || value === null || value === undefined ? 0 : Number(value);
                      updatedItem.quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;
                  } else if (field === 'cost') {
                      const newCost = value === '' || value === null || value === undefined ? 0 : parseFloat(value.toString());
                      updatedItem.cost = isNaN(newCost) || newCost < 0 ? 0 : newCost;
                      
                      // Kiểm tra xung đột giá
                      if (updatedItem.productDetails && updatedItem.productDetails.costPrice && !isNaN(newCost) && newCost > 0) {
                          const currentCostPrice = updatedItem.productDetails.costPrice / 1000;
                          const hasPriceConflict = Math.abs(newCost - currentCostPrice) > 0.001;
                          updatedItem.hasPriceConflict = hasPriceConflict;
                          
                          if (hasPriceConflict && !updatedItem.priceAction) {
                              setConflictItem({...updatedItem});
                              setShowPriceConflictDialog(true);
                          }
                      }
                  }
                  return updatedItem;
              }
              return item;
          })
      );
  };

  const addItemField = () => {
    if (inventory.length === 0) {
      toast({ title: "Lỗi", description: "Vui lòng thêm sản phẩm vào kho hàng trước.", variant: "destructive" });
      return;
    }

    const newItem: LocalItemToImport = createNewItem();
    setItemsToImport(prev => [...prev, newItem]);
  };

  useEffect(() => {
    setItemsToImport(prevItems =>
        prevItems.map(item => {
            const { name, color, quality, size, unit } = item;
            if (!name || !color || !unit) return item;
            
            const normalizedQuality = quality === 'none' ? undefined : quality;
            
            const matchedProduct = inventory.find(p => {
                const productQuality = p.quality === 'none' || !p.quality ? undefined : p.quality;
                const itemQuality = normalizedQuality === 'none' || !normalizedQuality ? undefined : normalizedQuality;
                
                return p.name === name &&
                    p.color === color &&
                    productQuality === itemQuality &&
                    p.size === size &&
                    p.unit === unit;
            });
            
            return {
                ...item,
                productDetails: matchedProduct || null,
                selectedProductId: matchedProduct ? matchedProduct.id : null,
                error: matchedProduct ? undefined : 'Sản phẩm với thuộc tính này không tồn tại.',
                cost: matchedProduct && matchedProduct.costPrice ? matchedProduct.costPrice / 1000 : item.cost,
                // KHÔNG auto-fill giá bán - để người dùng tự do nhập
                batchNumber: matchedProduct ? getNextBatchNumber(item.name, item.color, normalizedQuality, item.size, item.unit) : item.batchNumber,
            };
        })
    );
  }, [inventory]);

  const canConfirmImport = useMemo(() => {
    if (itemsToImport.length === 0) return false;
    
    // Debug để kiểm tra từng item
    const debugInfo = itemsToImport.map((item, index) => ({
      index,
      name: item.name,
      color: item.color,
      quantity: item.quantity,
      cost: item.cost,
      price: item.price,
      error: item.error,
      valid: item.name && item.color && !item.error && item.quantity > 0 && item.cost > 0 && item.price > 0
    }));
    
    console.log('Import validation debug:', debugInfo);
    
    // CHỈ CẦN: tên, màu, không có lỗi, số lượng > 0, giá gốc > 0, giá bán > 0 (batch number sẽ tự động tính)
    return itemsToImport.every(item => 
      item.name && 
      item.color && 
      !item.error && 
      item.quantity > 0 && 
      item.cost > 0 &&
      item.price > 0 &&
      !isNaN(item.quantity) &&
      !isNaN(item.cost) &&
      !isNaN(item.price)
    );
  }, [itemsToImport]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Lỗi", description: "Không tìm thấy thông tin người dùng. Vui lòng thử đăng nhập lại.", variant: "destructive" });
      return;
    }

    if (!canConfirmImport) {
        const firstErrorItem = itemsToImport.find(item => 
          !item.name || !item.color || item.error || item.quantity <= 0 || item.cost <= 0 || item.price <= 0
        );
        if (firstErrorItem?.error) {
            toast({ title: "Lỗi", description: `Lỗi ở một sản phẩm: ${firstErrorItem.error} Vui lòng kiểm tra lại.`, variant: "destructive" });
        } else if (itemsToImport.some(item => item.quantity <= 0 || item.cost <= 0 || item.price <= 0)) {
             toast({ title: "Lỗi", description: 'Số lượng, giá gốc và giá bán phải > 0 cho tất cả sản phẩm.', variant: "destructive" });
        } else if (itemsToImport.some(item => !item.name || !item.color)) {
            toast({ title: "Lỗi", description: 'Vui lòng chọn tên sản phẩm và màu sắc cho tất cả sản phẩm.', variant: "destructive" });
        } else {
            toast({ title: "Lỗi", description: 'Vui lòng kiểm tra lại thông tin các sản phẩm nhập.', variant: "destructive" });
        }
        return;
    }

    // Tìm sản phẩm trong kho để lấy ID
    const itemsWithProducts = itemsToImport.map(item => {
      const matchedProduct = inventory.find(p => {
        const productQuality = p.quality === 'none' || !p.quality ? undefined : p.quality;
        const itemQuality = item.quality === 'none' || !item.quality ? undefined : item.quality;
        
        return p.name === item.name &&
            p.color === item.color &&
            productQuality === itemQuality &&
            p.size === (item.size || '') &&
            p.unit === (item.unit || '');
      });
      
      return { ...item, matchedProduct };
    });

    const validItems = itemsWithProducts.filter(item => 
        item.matchedProduct && 
        !item.error && 
        item.quantity > 0 && 
        item.cost > 0 &&
        item.price > 0 &&
        !isNaN(item.quantity) &&
        !isNaN(item.cost) &&
        !isNaN(item.price)
    );

    if (validItems.length === 0) {
        toast({ title: "Lỗi", description: "Không có sản phẩm hợp lệ để nhập.", variant: "destructive" });
        return;
    }

    const itemsToSubmit: {
        productId: string;
        quantity: number;
        costPriceVND: number;
        salePriceVND: number; // Giá bán riêng cho lô mới
        batchNumber: number; // Số lô hàng mới
        priceAction?: 'keep' | 'update';
    }[] = validItems.map(item => {
        const costVND = Math.round((item.cost || 0) * 1000);
        const salePriceVND = Math.round((item.price || 0) * 1000); // Chuyển từ nghìn VND sang VND
        
        // Tính toán batch number tự động dựa trên sản phẩm còn trong kho
        const calculatedBatchNumber = getNextBatchNumber(
            item.name, 
            item.color, 
            item.quality, 
            item.size, 
            item.unit
        );
        
        const result = {
            productId: item.matchedProduct!.id,
            quantity: item.quantity || 0,
            costPriceVND: isNaN(costVND) ? 0 : costVND,
            salePriceVND: isNaN(salePriceVND) ? 0 : salePriceVND,
            batchNumber: calculatedBatchNumber, // Sử dụng batch number được tính tự động
            priceAction: item.priceAction || 'keep'
        };
        
        console.log('Item to submit:', {
            name: item.name,
            color: item.color,
            originalBatchNumber: item.batchNumber,
            calculatedBatchNumber: calculatedBatchNumber,
            rawCost: item.cost, // nghìn VND
            costVND: costVND, // VND
            rawPrice: item.price, // nghìn VND  
            salePriceVND: salePriceVND, // VND
            quantity: item.quantity,
            result
        });
        
        return result;
    });

    const totalCostVND = itemsToSubmit.reduce((sum, item) => sum + item.costPriceVND * item.quantity, 0);

    const success = await onImportProducts(
        undefined, // supplierName
        itemsToSubmit,
        totalCostVND,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Unknown'
    );

    if (success) {
        setItemsToImport([createNewItem()]);
        toast({ title: "Thành công", description: `Đã nhập ${validItems.length} sản phẩm vào kho.` });
    }
  };

  const handlePriceConflictResolution = (action: 'keep' | 'update') => {
    if (!conflictItem) return;
    
    setItemsToImport(prev => prev.map(item => 
        item.key === conflictItem.key 
            ? { ...item, priceAction: action, hasPriceConflict: false }
            : item
    ));
    
    setShowPriceConflictDialog(false);
    setConflictItem(null);
  };

  const removeItem = (index: number) => {
    if (itemsToImport.length === 1) {
      setItemsToImport([createNewItem()]);
    } else {
      setItemsToImport(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getUniqueProductNames = () => {
    return [...new Set(inventory.map(p => p.name))].filter(name => name && name.trim() !== '');
  };

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <EmptyBoxIllustration className="w-48 h-48 mb-6 opacity-50" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Kho hàng trống</h3>
        <p className="text-gray-500">Vui lòng thêm sản phẩm vào kho trước khi nhập hàng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ImportIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nhập hàng</h2>
          <p className="text-gray-600">Quản lý việc nhập hàng mới vào kho</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="space-y-6">
        {itemsToImport.map((item, index) => {
          const availableOptions = getAvailableOptionsForProduct(item.name, item.color, item.quality, item.size);
          const showColorSelect = item.name && availableOptions.colors.length > 0;
          const showQualitySelect = item.name && item.color && availableOptions.qualities.length > 0;
          const showSizeSelect = item.name && item.color && 
            (availableOptions.qualities.length === 0 || item.quality) && 
            availableOptions.sizes.length > 0;
          const showUnitSelect = item.name && item.color && 
            (availableOptions.qualities.length === 0 || item.quality) &&
            (availableOptions.sizes.length === 0 || item.size) &&
            availableOptions.units.length > 0;

          // Tính batch number tự động cho sản phẩm hiện tại
          const autoNextBatch = item.productDetails ? 
            getNextBatchNumber(item.name, item.color, item.quality, item.size, item.unit) :
            1; // Mặc định là 1 nếu chưa chọn sản phẩm

          return (
            <Card key={item.key} className={`transition-all duration-300 ${
              item.productDetails 
                ? 'border-green-300 shadow-green-100' 
                : item.error 
                  ? 'border-red-300 shadow-red-100' 
                  : 'border-amber-300 shadow-amber-100'
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Sản phẩm {index + 1}
                    {item.productDetails && <span className="text-green-600 text-sm ml-2">✓ Đã chọn</span>}
                    {item.error && <span className="text-red-600 text-sm ml-2">⚠ Lỗi</span>}
                    {!item.productDetails && !item.error && <span className="text-amber-600 text-sm ml-2">⏳ Đang chọn</span>}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {item.error && (
                  <p className="text-red-600 text-sm mt-1 animate-fade-in">{item.error}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Tên sản phẩm - LUÔN HIỂN THỊ */}
                <div className="grid lg:grid-cols-1 gap-4">
                  <div className="transform transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên sản phẩm
                      <span className="text-blue-600 text-xs ml-2">Bước 1</span>
                    </label>
                    <Select value={item.name} onValueChange={value => handleItemChange(index, 'name', value)}>
                      <SelectTrigger className={`w-full transition-all duration-300 ${
                        item.name ? 'border-green-300 focus:border-green-500' : 'border-gray-300'
                      }`}>
                        <SelectValue placeholder="Chọn tên sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueProductNames().map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Step 2: Màu sắc - HIỂN THỊ KHI CÓ TÊN */}
                {showColorSelect && (
                  <div className="grid lg:grid-cols-1 gap-4 animate-slide-in-right">
                    <div className="transform transition-all duration-300 ease-in-out">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Màu sắc
                        <span className="text-blue-600 text-xs ml-2">Bước 2</span>
                      </label>
                      <Select value={item.color} onValueChange={value => handleItemChange(index, 'color', value)}>
                        <SelectTrigger className={`w-full transition-all duration-300 ${
                          item.color ? 'border-green-300 focus:border-green-500' : 'border-amber-300 focus:border-amber-500'
                        }`}>
                          <SelectValue placeholder="Chọn màu sắc" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.colors.map(color => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 3: Chất lượng - HIỂN THỊ KHI CÓ MÀU VÀ CÓ OPTIONS */}
                {showQualitySelect && (
                  <div className="grid lg:grid-cols-1 gap-4 animate-slide-in-right">
                    <div className="transform transition-all duration-300 ease-in-out">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chất lượng
                        <span className="text-blue-600 text-xs ml-2">Bước 3</span>
                      </label>
                      <Select value={item.quality || ''} onValueChange={value => handleItemChange(index, 'quality', value)}>
                        <SelectTrigger className={`w-full transition-all duration-300 ${
                          item.quality ? 'border-green-300 focus:border-green-500' : 'border-amber-300 focus:border-amber-500'
                        }`}>
                          <SelectValue placeholder="Chọn chất lượng" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.qualities.map(quality => (
                            <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 4: Kích thước - HIỂN THỊ KHI THỎA ĐIỀU KIỆN */}
                {showSizeSelect && (
                  <div className="grid lg:grid-cols-1 gap-4 animate-slide-in-right">
                    <div className="transform transition-all duration-300 ease-in-out">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kích thước
                        <span className="text-blue-600 text-xs ml-2">Bước 4</span>
                      </label>
                      <Select value={item.size} onValueChange={value => handleItemChange(index, 'size', value)}>
                        <SelectTrigger className={`w-full transition-all duration-300 ${
                          item.size ? 'border-green-300 focus:border-green-500' : 'border-amber-300 focus:border-amber-500'
                        }`}>
                          <SelectValue placeholder="Chọn kích thước" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.sizes.map(size => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 5: Đơn vị - HIỂN THỊ KHI THỎA ĐIỀU KIỆN */}
                {showUnitSelect && (
                  <div className="grid lg:grid-cols-1 gap-4 animate-slide-in-right">
                    <div className="transform transition-all duration-300 ease-in-out">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn vị
                        <span className="text-blue-600 text-xs ml-2">Bước 5</span>
                      </label>
                      <Select value={item.unit} onValueChange={value => handleItemChange(index, 'unit', value)}>
                        <SelectTrigger className={`w-full transition-all duration-300 ${
                          item.unit ? 'border-green-300 focus:border-green-500' : 'border-amber-300 focus:border-amber-500'
                        }`}>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Các trường khác - LUÔN HIỂN THỊ */}
                <div className="grid gap-4 transition-all duration-300 lg:grid-cols-2">
                  <div className="transform transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lượng nhập
                      {!item.productDetails && <span className="text-amber-600 text-xs ml-2">Chọn sản phẩm trước</span>}
                      {item.productDetails && <span className="text-green-600 text-xs ml-2">✓ Sẵn sàng</span>}
                    </label>
                    <Input 
                        id={`quantity-${item.key}`} 
                        type="number" 
                        min="1" 
                        value={item.quantity === 0 ? '' : item.quantity.toString()}
                        onChange={e => {
                            const value = e.target.value;
                            const numValue = value === '' || value === null ? 0 : parseInt(value);
                            const finalValue = isNaN(numValue) ? 0 : numValue;
                            handleItemChange(index, 'quantity', finalValue);
                        }} 
                        className={`w-full bg-card transition-all duration-300 ease-in-out rounded-lg ${
                            item.productDetails 
                                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                                : 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                        }`}
                        placeholder="Nhập số lượng"
                        required
                    />
                  </div>

                  <div className="transform transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá gốc (nghìn VND)
                      {item.hasPriceConflict && (
                        <span className="text-orange-600 text-xs ml-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Giá khác với kho
                        </span>
                      )}
                      {!item.productDetails && <span className="text-amber-600 text-xs ml-2">Chọn sản phẩm trước</span>}
                      {item.productDetails && !item.hasPriceConflict && <span className="text-green-600 text-xs ml-2">✓ Sẵn sàng</span>}
                    </label>
                    <Input 
                        id={`cost-price-${item.key}`} 
                        type="number" 
                        min="0" 
                        step="any" 
                        value={item.cost === 0 ? '' : item.cost.toString()}
                        onChange={e => {
                            const value = e.target.value;
                            const numValue = value === '' || value === null ? 0 : parseFloat(value);
                            const finalValue = isNaN(numValue) ? 0 : numValue;
                            handleItemChange(index, 'cost', finalValue);
                        }} 
                        className={`w-full bg-card transition-all duration-300 ease-in-out rounded-lg ${
                            item.hasPriceConflict
                                ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                                : item.productDetails 
                                    ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                                    : 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                        }`}
                        placeholder="Nhập giá gốc"
                        required
                    />
                    {item.productDetails?.costPrice && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-500">
                          Giá hiện tại trong kho: <span className="font-medium">{(item.productDetails.costPrice / 1000).toLocaleString()} nghìn VND</span>
                        </p>
                        {item.hasPriceConflict && item.priceAction && (
                          <p className={`text-sm font-medium ${
                            item.priceAction === 'update' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {item.priceAction === 'update' 
                              ? `✓ Sẽ cập nhật giá thành ${item.cost.toLocaleString()} nghìn VND`
                              : `✓ Sẽ giữ giá cũ ${(item.productDetails.costPrice / 1000).toLocaleString()} nghìn VND`
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Thêm dòng mới cho giá bán */}
                <div className="grid gap-4 transition-all duration-300 lg:grid-cols-1">
                  <div className="transform transition-all duration-300 ease-in-out">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá bán (nghìn VND)
                      <span className="text-green-600 text-xs ml-2">Tự do đặt giá</span>
                      {!item.productDetails && <span className="text-amber-600 text-xs ml-2">Chọn sản phẩm trước</span>}
                      {item.productDetails && (
                        <span className="text-blue-600 text-xs ml-2">
                          Sẽ tạo lô {autoNextBatch} mới
                        </span>
                      )}
                    </label>
                    <Input 
                        id={`price-${item.key}`} 
                        type="number" 
                        min="0" 
                        step="any" 
                        value={item.price === 0 ? '' : item.price.toString()}
                        onChange={e => {
                            const value = e.target.value;
                            const numValue = value === '' || value === null ? 0 : parseFloat(value);
                            const finalValue = isNaN(numValue) ? 0 : numValue;
                            handleItemChange(index, 'price', finalValue);
                        }} 
                        className={`w-full bg-card transition-all duration-300 ease-in-out rounded-lg ${
                            item.productDetails 
                                ? 'border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200' 
                                : 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                        }`}
                        placeholder="Nhập giá bán cho lô hàng mới"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {item.productDetails ? 
                        `Sẽ tự động tạo lô ${autoNextBatch} mới với giá bán riêng biệt` :
                        "Chọn đầy đủ thông tin sản phẩm để xem lô hàng sẽ được tạo"
                      }
                    </p>
                  </div>
                </div>

                {item.productDetails && (
                  <div className="bg-green-50 p-3 rounded-lg animate-fade-in">
                    <p className="text-green-800 text-sm">
                      <strong>Sản phẩm đã chọn:</strong> {item.productDetails.name} - {item.productDetails.color}
                      {item.productDetails.quality && ` - ${item.productDetails.quality}`}
                      {item.productDetails.size && ` - ${item.productDetails.size}`}
                      {item.productDetails.unit && ` - ${item.productDetails.unit}`}
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Số lượng hiện tại: {item.productDetails.quantity}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={addItemField}
            className="flex-1"
          >
            Thêm sản phẩm khác
          </Button>
          <Button
            type="submit"
            disabled={!canConfirmImport}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Xác nhận nhập hàng
          </Button>
        </div>
      </form>

      {/* Price Conflict Dialog */}
      <Dialog open={showPriceConflictDialog} onOpenChange={setShowPriceConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Phát hiện giá nhập khác với kho
            </DialogTitle>
            <DialogDescription>
              Giá nhập bạn vừa nhập khác với giá hiện tại trong kho. Bạn muốn làm gì với giá này?
            </DialogDescription>
          </DialogHeader>
          
          {conflictItem?.productDetails && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="border-b pb-2">
                <p className="font-medium text-gray-900">
                  {conflictItem.productDetails.name} - {conflictItem.productDetails.color}
                  {conflictItem.productDetails.quality && ` - ${conflictItem.productDetails.quality}`}
                  {conflictItem.productDetails.size && ` - ${conflictItem.productDetails.size}`}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-600 font-medium">Giá hiện tại trong kho</p>
                  <p className="text-lg font-bold text-blue-700">
                    {(conflictItem.productDetails.costPrice! / 1000).toLocaleString()} nghìn VND
                  </p>
                </div>
                
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-sm text-orange-600 font-medium">Giá nhập mới</p>
                  <p className="text-lg font-bold text-orange-700">
                    {conflictItem.cost.toLocaleString()} nghìn VND
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Lưu ý:</strong> Quyết định này sẽ ảnh hưởng đến việc tính toán lợi nhuận và báo cáo.</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => handlePriceConflictResolution('keep')}
              className="flex-1"
            >
              <div className="text-center">
                <div className="font-medium">Giữ giá cũ</div>
                <div className="text-xs text-gray-500">Không thay đổi giá trong kho</div>
              </div>
            </Button>
            <Button
              onClick={() => handlePriceConflictResolution('update')}
              className="bg-orange-600 hover:bg-orange-700 flex-1"
            >
              <div className="text-center">
                <div className="font-medium">Cập nhật giá mới</div>
                <div className="text-xs opacity-90">Thay đổi giá trong kho</div>
              </div>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}