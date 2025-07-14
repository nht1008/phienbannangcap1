"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryTab } from './InventoryTab';
import { ImportTab } from './ImportTab';
import type { Product, Invoice, ProductOptionType } from '@/types';
import type { User } from 'firebase/auth';

interface WarehouseTabProps {
  inventory: Product[];
  invoices: Invoice[];
  onOpenAddProductDialog: () => void;
  onOpenEditProductDialog: (product: Product) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onAddOption: (type: ProductOptionType, name: string) => Promise<void>;
  onDeleteOption: (type: ProductOptionType, name: string) => Promise<void>;
  hasFullAccessRights: boolean;
  onDisposeProductItems: (
    productId: string, 
    quantityToDecrease: number, 
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'images'>,
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  currentUser: User | null;
  storefrontProductIds: Record<string, boolean>;
  onAddToStorefront: (productId: string) => Promise<void>;
  onRemoveFromStorefront: (productId: string) => Promise<void>;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onImportProducts: (
    supplierName: string | undefined,
    itemsToSubmit: {
      productId: string;
      quantity: number;
      costPriceVND: number;
      salePriceVND: number; // Thêm giá bán
      batchNumber: number; // Thêm batch number tự động
      priceAction?: 'keep' | 'update';
    }[],
    totalCostVND: number,
    employeeId: string,
    employeeName: string
  ) => Promise<boolean>;
}

// Component cho tab "Loại bỏ hàng hỏng"
const DisposalTab: React.FC<{
  inventory: Product[];
  onDisposeProductItems: (
    productId: string, 
    quantityToDecrease: number, 
    reason: string,
    productDetails: Pick<Product, 'name' | 'color' | 'quality' | 'size' | 'unit' | 'images'>,
    employeeId: string,
    employeeName: string
  ) => Promise<void>;
  currentUser: User | null;
}> = ({ inventory, onDisposeProductItems, currentUser }) => {
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<number>(0);
  const [quantityToDispose, setQuantityToDispose] = useState<number>(0);
  const [disposalReason, setDisposalReason] = useState<string>('');

  // Lấy danh sách tên sản phẩm từ inventory thực tế
  const availableProductNames = React.useMemo(() => {
    return [...new Set(inventory.map(p => p.name))].filter(Boolean);
  }, [inventory]);

  // Lấy các thuộc tính có sẵn cho sản phẩm đã chọn từ inventory thực tế
  const getAvailableOptionsForProduct = (productName: string) => {
    if (!productName) {
      return { colors: [], qualities: [], sizes: [], units: [], batchNumbers: [], hasNoQuality: false };
    }
    
    const productsWithSameName = inventory.filter(p => p.name === productName && p.quantity > 0);
    
    // Lọc bỏ giá trị rỗng và undefined/null một cách nghiêm ngặt
    const availableColors = [...new Set(productsWithSameName.map(p => p.color))].filter(color => color && color.trim() !== '') as string[];
    const availableQualities = [...new Set(productsWithSameName.map(p => p.quality))].filter(q => q !== undefined && q !== null && q !== '' && q.trim() !== '') as string[];
    const availableSizes = [...new Set(productsWithSameName.map(p => p.size))].filter(size => size && size.trim() !== '') as string[];
    const availableUnits = [...new Set(productsWithSameName.map(p => p.unit))].filter(unit => unit && unit.trim() !== '') as string[];
    const availableBatchNumbers = [...new Set(productsWithSameName.map(p => p.batchNumber || 1))].filter(batch => batch > 0).sort((a, b) => a - b);
    
    // Kiểm tra xem có sản phẩm nào có quality là undefined/null/empty không
    const hasNoQuality = productsWithSameName.some(p => p.quality === undefined || p.quality === null || p.quality === '' || p.quality.trim() === '');

    return {
      colors: availableColors,
      qualities: availableQualities,
      sizes: availableSizes,
      units: availableUnits,
      batchNumbers: availableBatchNumbers,
      hasNoQuality: hasNoQuality
    };
  };

  const availableOptions = React.useMemo(() => 
    getAvailableOptionsForProduct(selectedProductName), 
    [selectedProductName, inventory]
  );

  // Tìm sản phẩm phù hợp với các thuộc tính đã chọn
  const matchingProduct = inventory.find(p => 
    p.name === selectedProductName &&
    p.color === selectedColor &&
    (selectedQuality === 'none' || !selectedQuality ? !p.quality : p.quality === selectedQuality) &&
    p.size === selectedSize &&
    p.unit === selectedUnit &&
    (selectedBatchNumber === 0 || (p.batchNumber || 1) === selectedBatchNumber) &&
    p.quantity > 0
  );

  // Reset các thuộc tính khi thay đổi tên sản phẩm
  const handleProductNameChange = (name: string) => {
    setSelectedProductName(name);
    
    // Reset tất cả các thuộc tính để user chọn từng bước
    setSelectedColor('');
    setSelectedQuality('');
    setSelectedSize('');
    setSelectedUnit('');
    setSelectedBatchNumber(0);
    setQuantityToDispose(0);
  };

  // Reset các thuộc tính phía sau khi thay đổi màu
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedQuality('');
    setSelectedSize('');
    setSelectedUnit('');
    setSelectedBatchNumber(0);
    setQuantityToDispose(0);
  };

  // Reset các thuộc tính phía sau khi thay đổi quality
  const handleQualityChange = (quality: string) => {
    setSelectedQuality(quality);
    setSelectedSize('');
    setSelectedUnit('');
    setSelectedBatchNumber(0);
    setQuantityToDispose(0);
  };

  // Reset các thuộc tính phía sau khi thay đổi size
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setSelectedUnit('');
    setSelectedBatchNumber(0);
    setQuantityToDispose(0);
  };

  // Reset số lượng khi thay đổi unit
  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    setSelectedBatchNumber(0);
    setQuantityToDispose(0);
  };

  // Reset số lượng khi thay đổi batch number
  const handleBatchNumberChange = (batchNumber: number) => {
    setSelectedBatchNumber(batchNumber);
    setQuantityToDispose(0);
  };

  const handleDispose = async () => {
    if (matchingProduct && quantityToDispose > 0 && disposalReason.trim() && currentUser) {
      const productDetails = {
        name: matchingProduct.name,
        color: matchingProduct.color,
        quality: matchingProduct.quality,
        size: matchingProduct.size,
        unit: matchingProduct.unit,
        images: matchingProduct.images
      };
      
      await onDisposeProductItems(
        matchingProduct.id, 
        quantityToDispose, 
        disposalReason, 
        productDetails,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Unknown'
      );
      
      setSelectedProductName('');
      setSelectedColor('');
      setSelectedQuality('');
      setSelectedSize('');
      setSelectedUnit('');
      setSelectedBatchNumber(0);
      setQuantityToDispose(0);
      setDisposalReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loại bỏ hàng hỏng/không bán được</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tên sản phẩm - luôn hiển thị */}
          <div className="transform transition-all duration-300 ease-in-out">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm
            </label>
            <select
              value={selectedProductName}
              onChange={(e) => handleProductNameChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn tên sản phẩm --</option>
              {availableProductNames.map(name => {
                const variantCount = inventory.filter(p => p.name === name && p.quantity > 0).length;
                return (
                  <option key={name} value={name}>
                    {name} ({variantCount} biến thể có sẵn)
                  </option>
                );
              })}
            </select>
            {selectedProductName && (
              <p className="text-xs text-gray-500 mt-1 animate-fade-in">
                {availableOptions.colors.length} màu{availableOptions.qualities.length > 0 ? `, ${availableOptions.qualities.length} chất lượng` : ''}, {availableOptions.sizes.length} kích thước, {availableOptions.units.length} đơn vị
              </p>
            )}
          </div>

          {/* Màu sắc - với animation */}
          {selectedProductName && availableOptions.colors.length > 0 && (
          <div className="transform transition-all duration-500 ease-in-out animate-slide-in-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Màu sắc <span className="text-green-600 text-xs">← Bước tiếp theo</span>
            </label>
            <select
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full border border-green-300 focus:border-green-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn màu sắc --</option>
              {availableOptions.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          )}

          {/* Chất lượng - với animation */}
          {selectedColor && availableOptions.qualities.length > 0 && (
          <div className="transform transition-all duration-500 ease-in-out animate-slide-in-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chất lượng <span className="text-green-600 text-xs">← Bước tiếp theo</span>
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              className="w-full border border-green-300 focus:border-green-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn chất lượng --</option>
              {availableOptions.hasNoQuality && <option value="none">Không chọn</option>}
              {availableOptions.qualities.map(quality => (
                <option key={quality} value={quality}>{quality}</option>
              ))}
            </select>
          </div>
          )}

          {/* Kích thước - với animation */}
          {selectedColor && (availableOptions.qualities.length === 0 || selectedQuality) && availableOptions.sizes.length > 0 && (
          <div className="transform transition-all duration-500 ease-in-out animate-slide-in-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kích thước <span className="text-green-600 text-xs">← Bước tiếp theo</span>
            </label>
            <select
              value={selectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full border border-green-300 focus:border-green-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn kích thước --</option>
              {availableOptions.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          )}

          {/* Đơn vị - với animation */}
          {selectedSize && availableOptions.units.length > 0 && (
          <div className="transform transition-all duration-500 ease-in-out animate-slide-in-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn vị <span className="text-green-600 text-xs">← Bước tiếp theo</span>
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full border border-green-300 focus:border-green-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn đơn vị --</option>
              {availableOptions.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          )}

          {/* Lô hàng - với animation */}
          {selectedUnit && availableOptions.batchNumbers.length > 0 && (
          <div className="transform transition-all duration-500 ease-in-out animate-slide-in-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lô hàng <span className="text-green-600 text-xs">← Bước cuối cùng</span>
            </label>
            <select
              value={selectedBatchNumber === 0 ? '' : selectedBatchNumber.toString()}
              onChange={(e) => handleBatchNumberChange(parseInt(e.target.value) || 0)}
              className="w-full border border-blue-300 focus:border-blue-500 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn lô hàng --</option>
              {availableOptions.batchNumbers.map(batch => (
                <option key={batch} value={batch.toString()}>Lô {batch}</option>
              ))}
            </select>
            <p className="text-xs text-blue-600 mt-1">
              Chọn lô hàng để loại bỏ sản phẩm từ lô nhập cụ thể
            </p>
          </div>
          )}
        </div>

        {/* Số lượng - LUÔN HIỂN THỊ với animation */}
        <div className="mt-4 transform transition-all duration-300 ease-in-out">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số lượng loại bỏ
            {!matchingProduct && <span className="text-amber-600 text-xs ml-2">Chọn sản phẩm trước</span>}
            {matchingProduct && <span className="text-green-600 text-xs ml-2">✓ Sẵn sàng</span>}
          </label>
          <input
            type="number"
            min="1"
            max={matchingProduct?.quantity || 999}
            value={quantityToDispose === 0 ? '' : quantityToDispose}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? 0 : parseInt(value) || 0;
              setQuantityToDispose(numValue);
            }}
            className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out ${
              matchingProduct 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                : 'border-amber-300 focus:border-amber-500 focus:ring-amber-200'
            }`}
            placeholder="Nhập số lượng loại bỏ"
          />
          {matchingProduct && (
            <div className="mt-1 animate-fade-in space-y-1">
              <p className="text-sm text-gray-500">Còn lại: {matchingProduct.quantity}</p>
              <p className="text-sm text-blue-600">
                Lô hàng: {matchingProduct.batchNumber || 1}
              </p>
            </div>
          )}
        </div>

        {/* Lý do loại bỏ - LUÔN HIỂN THỊ với animation */}
        <div className="mt-4 transform transition-all duration-300 ease-in-out">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do loại bỏ
          </label>
          <textarea
            value={disposalReason}
            onChange={(e) => setDisposalReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 ease-in-out"
            placeholder="Nhập lý do loại bỏ (hàng hỏng, hết hạn, không bán được...)"
          />
        </div>

        <div className="mt-4">
          <Button
            onClick={handleDispose}
            disabled={!matchingProduct || quantityToDispose <= 0 || !disposalReason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Xác nhận loại bỏ
          </Button>
        </div>
      </div>

      {/* Lịch sử loại bỏ - có thể thêm sau */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử loại bỏ gần đây</h3>
        <p className="text-gray-500">Chức năng này sẽ được phát triển để hiển thị lịch sử loại bỏ hàng hóa.</p>
      </div>
    </div>
  );
};

export const WarehouseTab: React.FC<WarehouseTabProps> = ({
  inventory,
  invoices,
  onOpenAddProductDialog,
  onOpenEditProductDialog,
  onDeleteProduct,
  productNameOptions,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  onAddOption,
  onDeleteOption,
  hasFullAccessRights,
  onDisposeProductItems,
  currentUser,
  storefrontProductIds,
  onAddToStorefront,
  onRemoveFromStorefront,
  onUpdateProduct,
  onImportProducts,
}) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Quản lý sản phẩm</TabsTrigger>
          <TabsTrigger value="import">Nhập hàng</TabsTrigger>
          <TabsTrigger value="disposal">Loại bỏ hàng hỏng</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="mt-6">
          <InventoryTab
            inventory={inventory}
            invoices={invoices}
            onOpenAddProductDialog={onOpenAddProductDialog}
            onOpenEditProductDialog={onOpenEditProductDialog}
            onDeleteProduct={onDeleteProduct}
            productNameOptions={productNameOptions}
            colorOptions={colorOptions}
            productQualityOptions={productQualityOptions}
            sizeOptions={sizeOptions}
            unitOptions={unitOptions}
            onAddOption={onAddOption}
            onDeleteOption={onDeleteOption}
            hasFullAccessRights={hasFullAccessRights}
            storefrontProductIds={storefrontProductIds}
            onAddToStorefront={onAddToStorefront}
            onRemoveFromStorefront={onRemoveFromStorefront}
            onUpdateProduct={onUpdateProduct}
          />
        </TabsContent>
        
        <TabsContent value="import" className="mt-6">
          <ImportTab
            inventory={inventory}
            onImportProducts={onImportProducts}
            currentUser={currentUser}
          />
        </TabsContent>
        
        <TabsContent value="disposal" className="mt-6">
          <DisposalTab
            inventory={inventory}
            onDisposeProductItems={onDisposeProductItems}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
