"use client";

import React, { useState, useMemo } from 'react';
import type { Product, ProductOptionType } from '@/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter, 
    DialogDescription 
} from "@/components/ui/dialog";
import Image from 'next/image';
import { PlusCircle, Trash2, Settings, Pencil, Search, Store, XCircle, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProductThumbnail, hasOwnThumbnail, hasGroupThumbnail, canUploadThumbnail } from '@/lib/product-thumbnail-utils';
import { normalizeStringForSearch } from '@/lib/utils';
import { Label } from '../ui/label';
import type { Invoice } from '@/types';
import { ProductThumbnailUpload } from '@/components/products/ProductThumbnailUpload';


interface InventoryTabProps {
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
  storefrontProductIds: Record<string, boolean>;
  onAddToStorefront: (productId: string) => Promise<void>;
  onRemoveFromStorefront: (productId: string) => Promise<void>;
  onUpdateProduct?: (updatedProduct: Product) => void; // Thêm prop để cập nhật sản phẩm
}


export function InventoryTab({
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
  storefrontProductIds,
  onAddToStorefront,
  onRemoveFromStorefront,
  onUpdateProduct
}: InventoryTabProps) {
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [currentOptionType, setCurrentOptionType] = useState<ProductOptionType | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [thumbnailUploadState, setThumbnailUploadState] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({
    isOpen: false,
    product: null
  });
  const { toast } = useToast();
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const openOptionsDialog = (type: ProductOptionType) => {
    setCurrentOptionType(type);
    setIsOptionsDialogOpen(true);
    setNewOptionName('');
  };

  const handleAddNewOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOptionType && newOptionName.trim()) {
      await onAddOption(currentOptionType, newOptionName.trim());
      setNewOptionName(''); 
    }
  };

  const getOptionsForType = (type: ProductOptionType | null): string[] => {
    if (type === 'colors') return colorOptions;
    if (type === 'qualities') return productQualityOptions;
    if (type === 'sizes') return sizeOptions;
    if (type === 'units') return unitOptions;
    return [];
  };
  
  const getOptionDialogTitle = (type: ProductOptionType | null): string => {
    if (type === 'colors') return 'Quản lý Màu sắc';
    if (type === 'qualities') return 'Quản lý Chất lượng';
    if (type === 'sizes') return 'Quản lý Kích thước';
    if (type === 'units') return 'Quản lý Đơn vị';
    return 'Quản lý tùy chọn';
  };

  // Function để tính màu sắc badge dựa trên số lô hàng
  const getBatchColor = (product: Product, allProducts: Product[]) => {
    const batchNumber = product.batchNumber || 1;
    
    // Tìm TẤT CẢ sản phẩm cùng nhóm (bao gồm cả những lô hết hàng)
    const sameProductGroup = allProducts.filter(p => {
      const nameMatch = p.name === product.name;
      const colorMatch = p.color === product.color;
      
      // FIX: So sánh quality với null-safety (empty string và undefined đều được coi là giống nhau)
      const normalizeQuality = (quality: string | undefined) => quality || '';
      const qualityMatch = normalizeQuality(p.quality) === normalizeQuality(product.quality);
      
      // FIX: So sánh size với null-safety  
      const normalizeSize = (size: string | undefined) => size || '';
      const sizeMatch = normalizeSize(p.size) === normalizeSize(product.size);
      
      // FIX: So sánh unit với null-safety
      const normalizeUnit = (unit: string | undefined) => unit || '';
      const unitMatch = normalizeUnit(p.unit) === normalizeUnit(product.unit);
      
      const isSameProduct = nameMatch && colorMatch && qualityMatch && sizeMatch && unitMatch;
      
      return isSameProduct;
    });
    
    // Lấy TẤT CẢ batch numbers từ nhóm sản phẩm này
    const allBatchNumbers = sameProductGroup.map(p => p.batchNumber || 1);
    
    // Sắp xếp và loại bỏ duplicate
    const uniqueBatchNumbers = [...new Set(allBatchNumbers)].sort((a, b) => a - b);
    
    const totalBatches = uniqueBatchNumbers.length;
    const minBatch = Math.min(...uniqueBatchNumbers);
    const maxBatch = Math.max(...uniqueBatchNumbers);
    
    // Logic XÁC ĐỊNH NHÃN
    let ageLabel = '';
    
    if (totalBatches === 1) {
      ageLabel = '';
    } else {
      if (batchNumber === minBatch) {
        ageLabel = 'Cũ nhất';
      } else if (batchNumber === maxBatch) {
        ageLabel = 'Mới nhất';
      } else {
        ageLabel = '';
      }
    }
    
    const finalLabel = ageLabel ? `Lô ${batchNumber} (${ageLabel})` : `Lô ${batchNumber}`;
    
    // ...existing code for color palette...
    const colorPalette = [
      { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', name: 'Đỏ' },
      { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', name: 'Xanh dương' },
      { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700', name: 'Xanh lá' },
      { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', name: 'Tím' },
      { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', name: 'Cam' },
      { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-700', name: 'Hồng' },
      { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', name: 'Chàm' },
      { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', name: 'Ngọc lam' },
      { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-700', name: 'Vàng' },
      { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-700', name: 'Xám' }
    ];
    
    const colorIndex = (batchNumber - 1) % colorPalette.length;
    const selectedColor = colorPalette[colorIndex];
    
    return {
      bg: selectedColor.bg,
      text: selectedColor.text,
      border: selectedColor.border,
      label: finalLabel
    };
  };

  const allProductsFiltered = useMemo(() => {
    let filteredProducts = inventory;
    
    // Áp dụng filter từ các tag đã chọn và text tìm kiếm
    const allSearchTerms = [...selectedFilters, inventorySearchQuery.trim()].filter(Boolean);
    
    if (allSearchTerms.length > 0) {
      filteredProducts = inventory.filter(item => {
        return allSearchTerms.every(searchTerm => {
          const normalizedTerm = normalizeStringForSearch(searchTerm);
          
          // Tạo text tìm kiếm từ tất cả thuộc tính quan trọng
          const searchableText = normalizeStringForSearch([
            item.name,
            item.color,
            item.quality,
            item.size,
            item.unit,
            item.batchNumber?.toString(),
            `lo ${item.batchNumber}`, // Thêm định dạng "lô X"
            item.price.toString(),
            item.costPrice?.toString(),
            item.quantity.toString()
          ].filter(Boolean).join(' '));
          
          // Xử lý các từ khóa đặc biệt
          if (normalizedTerm.includes('hetrang') || normalizedTerm.includes('het hang')) {
            return item.quantity === 0;
          }
          if (normalizedTerm.includes('conhang') || normalizedTerm.includes('con hang')) {
            return item.quantity > 0;
          }
          if (normalizedTerm.includes('cuunhat') || normalizedTerm.includes('cu nhat')) {
            // Logic kiểm tra lô cũ nhất - cần implement dựa trên getBatchColor
            return true;
          }
          if (normalizedTerm.includes('moinhat') || normalizedTerm.includes('moi nhat')) {
            // Logic kiểm tra lô mới nhất - cần implement dựa trên getBatchColor
            return true;
          }
          if (normalizedTerm.includes('duoi50k') || normalizedTerm.includes('duoi 50k')) {
            return item.price < 50000;
          }
          if (normalizedTerm.includes('50k100k') || normalizedTerm.includes('50k-100k')) {
            return item.price >= 50000 && item.price < 100000;
          }
          if (normalizedTerm.includes('100k200k') || normalizedTerm.includes('100k-200k')) {
            return item.price >= 100000 && item.price < 200000;
          }
          if (normalizedTerm.includes('tren200k') || normalizedTerm.includes('tren 200k')) {
            return item.price >= 200000;
          }
          
          // Tìm kiếm thông thường
          return searchableText.includes(normalizedTerm);
        });
      });
    }
    
    // Sắp xếp theo thứ tự ưu tiên: Tên → Màu → Chất lượng → Kích thước → Đơn vị → Lô hàng
    return filteredProducts.sort((a, b) => {
      // 1. Sắp xếp theo tên sản phẩm (A-Z)
      const nameCompare = (a.name || '').localeCompare(b.name || '', 'vi-VN');
      if (nameCompare !== 0) return nameCompare;
      
      // 2. Sắp xếp theo màu sắc (A-Z)
      const colorCompare = (a.color || '').localeCompare(b.color || '', 'vi-VN');
      if (colorCompare !== 0) return colorCompare;
      
      // 3. Sắp xếp theo chất lượng (A-Z)
      const qualityCompare = (a.quality || '').localeCompare(b.quality || '', 'vi-VN');
      if (qualityCompare !== 0) return qualityCompare;
      
      // 4. Sắp xếp theo kích thước (A-Z)
      const sizeCompare = (a.size || '').localeCompare(b.size || '', 'vi-VN');
      if (sizeCompare !== 0) return sizeCompare;
      
      // 5. Sắp xếp theo đơn vị (A-Z)
      const unitCompare = (a.unit || '').localeCompare(b.unit || '', 'vi-VN');
      if (unitCompare !== 0) return unitCompare;
      
      // 6. Cuối cùng sắp xếp theo lô hàng (1, 2, 3...)
      const batchA = a.batchNumber || 999999;
      const batchB = b.batchNumber || 999999;
      return batchA - batchB;
    });
  }, [inventory, inventorySearchQuery, selectedFilters]);

  // Tạo danh sách gợi ý từ dữ liệu có sẵn
  const generateSearchSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    
    inventory.forEach(item => {
      // Thêm tên sản phẩm
      if (item.name) suggestions.add(item.name);
      
      // Thêm màu sắc
      if (item.color) suggestions.add(item.color);
      
      // Thêm chất lượng
      if (item.quality) suggestions.add(item.quality);
      
      // Thêm kích thước
      if (item.size) suggestions.add(item.size);
      
      // Thêm đơn vị
      if (item.unit) suggestions.add(item.unit);
      
      // Thêm số lô
      if (item.batchNumber) suggestions.add(`Lô ${item.batchNumber}`);
      
      // Thêm khoảng giá
      const price = item.price;
      if (price < 50000) suggestions.add('Dưới 50k');
      else if (price < 100000) suggestions.add('50k-100k');
      else if (price < 200000) suggestions.add('100k-200k');
      else suggestions.add('Trên 200k');
    });
    
    // Thêm các từ khóa phổ biến
    suggestions.add('Hết hàng');
    suggestions.add('Còn hàng');
    suggestions.add('Lô cũ nhất');
    suggestions.add('Lô mới nhất');
    
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'vi-VN'));
  }, [inventory]);

  // Xử lý gợi ý thông minh
  const handleSearchInputChange = (value: string) => {
    setInventorySearchQuery(value);
    
    if (value.trim().length > 0) {
      const normalizedValue = normalizeStringForSearch(value);
      const filteredSuggestions = generateSearchSuggestions.filter(suggestion =>
        normalizeStringForSearch(suggestion).includes(normalizedValue) &&
        !selectedFilters.includes(suggestion) // Loại bỏ các filter đã chọn
      ).slice(0, 8); // Giới hạn 8 gợi ý
      
      setSearchSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Chọn gợi ý và thêm vào filter
  const handleSuggestionClick = (suggestion: string) => {
    if (!selectedFilters.includes(suggestion)) {
      setSelectedFilters([...selectedFilters, suggestion]);
    }
    setInventorySearchQuery('');
    setShowSuggestions(false);
  };

  // Xóa filter
  const removeFilter = (filterToRemove: string) => {
    setSelectedFilters(selectedFilters.filter(filter => filter !== filterToRemove));
  };

  // Xóa tất cả filter
  const clearAllFilters = () => {
    setSelectedFilters([]);
    setInventorySearchQuery('');
  };

  // Xử lý upload thumbnail
  const handleThumbnailUpload = (product: Product) => {
    setThumbnailUploadState({
      isOpen: true,
      product
    });
  };

  const handleThumbnailUpdate = async (productId: string, thumbnailUrl: string) => {
    if (onUpdateProduct) {
      const updatedProduct = inventory.find(p => p.id === productId);
      if (updatedProduct) {
        // Cập nhật sản phẩm hiện tại
        await onUpdateProduct({
          ...updatedProduct,
          thumbnailImage: thumbnailUrl
        });
        
        // Tìm và cập nhật tất cả sản phẩm cùng tên
        const productsWithSameName = inventory.filter(p => 
          p.name === updatedProduct.name && 
          p.id !== productId &&
          (!p.thumbnailImage || p.thumbnailImage.trim() === '')
        );
        
        // Cập nhật từng sản phẩm cùng tên nếu chúng chưa có thumbnail riêng
        for (const product of productsWithSameName) {
          await onUpdateProduct({
            ...product,
            thumbnailImage: thumbnailUrl
          });
        }
      }
    }
  };

  const closeThumbnailUpload = () => {
    setThumbnailUploadState({
      isOpen: false,
      product: null
    });
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center px-1 py-2 gap-2">
        <div className="flex gap-2 items-center flex-wrap justify-end">
          {hasFullAccessRights && (
            <Button
              onClick={onOpenAddProductDialog}
              variant="default"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm sản phẩm
            </Button>
          )}
        </div>
      </div>
      
      <Card className="bg-muted/20">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-center sm:text-left text-xl font-semibold">Danh sách tất cả sản phẩm</CardTitle>
            <div className="relative w-full sm:w-auto sm:min-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              
              {/* Hiển thị các filter tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
                  >
                    {filter}
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2"
                    type="button"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              
              <Input
                type="search"
                placeholder={selectedFilters.length > 0 ? "Thêm bộ lọc..." : "Tìm theo tên, màu sắc, chất lượng, kích thước, lô hàng, giá..."}
                value={inventorySearchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => inventorySearchQuery.trim().length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-8 w-full bg-card h-9"
              />
              
              {/* Dropdown gợi ý thông minh */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="flex items-center gap-2">
                        <Search className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700">{suggestion}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-2 lg:p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    <TableHead key="h-stt-all" className="w-12 text-lg font-bold">STT</TableHead>,
                    <TableHead key="h-product-all" className="text-lg font-bold">Sản phẩm</TableHead>,
                    <TableHead key="h-batch-all" className="text-center text-lg font-bold">Lô hàng</TableHead>,
                    <TableHead key="h-attributes-all" className="text-lg font-bold">Thuộc tính</TableHead>,
                    <TableHead key="h-unit-all" className="text-lg font-bold">Đơn vị</TableHead>,
                    <TableHead key="h-quantity-all" className="text-right text-lg font-bold">Số lượng</TableHead>,
                    <TableHead key="h-costPrice-all" className="text-right text-lg font-bold text-blue-600">Giá gốc</TableHead>,
                    <TableHead key="h-price-all" className="text-right text-lg font-bold text-green-600">Giá bán</TableHead>,
                    <TableHead key="h-actions-all" className="text-center text-lg font-bold">Hành động</TableHead>,
                  ]}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProductsFiltered.map((item, index) => (
                  <TableRow key={item.id + "-all"}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="flex items-center text-lg font-bold">
                      <div className={`relative group mr-4 ${hasOwnThumbnail(item) ? 'ring-2 ring-blue-500 ring-offset-1' : hasGroupThumbnail(item, inventory) ? 'ring-2 ring-gray-400 ring-offset-1' : 'ring-2 ring-dashed ring-gray-300 ring-offset-1'} rounded-lg`}>
                        <Image
                            src={getProductThumbnail(item, inventory)}
                            alt={item.name}
                            width={50}
                            height={50}
                            className={`w-12 h-12 rounded-md object-cover aspect-square transition-opacity ${canUploadThumbnail(item, inventory) && hasFullAccessRights ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                            data-ai-hint={`${item.name.split(' ')[0]} flower`}
                            onClick={() => {
                              if (canUploadThumbnail(item, inventory) && hasFullAccessRights) {
                                handleThumbnailUpload(item);
                              }
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=No+Image';
                            }}
                        />
                        {hasFullAccessRights && canUploadThumbnail(item, inventory) && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center pointer-events-none">
                            <ImageIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {hasGroupThumbnail(item, inventory) && !hasOwnThumbnail(item) && (
                          <div className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title="Sử dụng ảnh đại diện từ sản phẩm cùng tên">
                            S
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        {hasGroupThumbnail(item, inventory) && !hasOwnThumbnail(item) && (
                          <span className="text-xs text-gray-500">Dùng ảnh nhóm</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const batchColor = getBatchColor(item, allProductsFiltered);
                        return (
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${batchColor.bg} ${batchColor.text} ${batchColor.border}`}
                            title={`Vị trí lô hàng trong nhóm sản phẩm cùng loại`}
                          >
                            {batchColor.label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm space-y-1">
                          {/* Hiển thị thuộc tính theo thứ tự: màu sắc - chất lượng - kích thước */}
                          {[item.color, item.quality, item.size].filter(Boolean).map((attr, index) => (
                            <div key={index}>{attr}</div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-md">
                      {(item.costPrice ?? 0).toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="bg-green-600 text-white px-2 py-1 rounded-md">
                        {item.price.toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                      {hasFullAccessRights && (
                        <>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onOpenEditProductDialog(item)} title="Sửa sản phẩm">
                              <Pencil className="h-4 w-4" />
                          </Button>
                          {storefrontProductIds[item.id] ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  await onRemoveFromStorefront(item.id);
                                  toast({ title: "Thành công", description: "Đã loại sản phẩm khỏi gian hàng." });
                                } catch (error) {
                                  toast({ title: "Lỗi", description: "Không thể loại sản phẩm khỏi gian hàng.", variant: "destructive" });
                                }
                              }}
                              title="Xóa khỏi gian hàng"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-green-600 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                              onClick={async () => {
                                try {
                                  await onAddToStorefront(item.id);
                                  toast({ title: "Thành công", description: "Đã thêm sản phẩm vào gian hàng." });
                                } catch (error) {
                                  toast({ title: "Lỗi", description: "Không thể thêm sản phẩm vào gian hàng.", variant: "destructive" });
                                }
                              }}
                              title="Thêm vào gian hàng"
                            >
                              <Store className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDeleteProduct(item.id)} title="Xóa sản phẩm">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allProductsFiltered.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                        {selectedFilters.length > 0 || inventorySearchQuery ? 
                          `Không tìm thấy sản phẩm nào với bộ lọc "${[...selectedFilters, inventorySearchQuery].filter(Boolean).join(', ')}".` : 
                          "Chưa có sản phẩm nào. Hãy thêm sản phẩm mới."
                        }
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">{/* Bảng sản phẩm */}
        {/** ...existing code... **/}
      </Card>

      {currentOptionType && (
        <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{getOptionDialogTitle(currentOptionType)}</DialogTitle>
              <DialogDescription>
                Thêm mới hoặc xóa các tùy chọn {currentOptionType === 'colors' ? 'màu sắc' : currentOptionType === 'qualities' ? 'chất lượng' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'}.
              </DialogDescription>
            </DialogHeader>
            {hasFullAccessRights && (
              <form onSubmit={handleAddNewOption} className="flex items-center gap-2 mt-4">
                <Input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder={`Tên ${currentOptionType === 'colors' ? 'màu' : currentOptionType === 'qualities' ? 'chất lượng' : currentOptionType === 'sizes' ? 'kích thước' : 'đơn vị'} mới`}
                  className="flex-grow"
                />
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">Thêm</Button>
              </form>
            )}
            <div className="mt-4 max-h-60 overflow-y-auto no-scrollbar">
              {getOptionsForType(currentOptionType).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có tùy chọn nào.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        <TableHead key="opt-name">Tên tùy chọn</TableHead>,
                        hasFullAccessRights && <TableHead key="opt-delete" className="text-right">Xóa</TableHead>,
                      ].filter(Boolean)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOptionsForType(currentOptionType).map(option => (
                      <TableRow key={option}>
                        <TableCell>{option}</TableCell>
                        {hasFullAccessRights && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onDeleteOption(currentOptionType, option)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsOptionsDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Product Thumbnail Upload Dialog */}
      {thumbnailUploadState.product && (
        <ProductThumbnailUpload
          isOpen={thumbnailUploadState.isOpen}
          onClose={closeThumbnailUpload}
          product={thumbnailUploadState.product}
          onThumbnailUpdate={handleThumbnailUpdate}
        />
      )}
    </div>
  );
}
