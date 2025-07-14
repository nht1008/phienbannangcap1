"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryTab } from './InventoryTab';
import { ImportTab } from './ImportTab';
import type { Product, Invoice, ProductOptionType } from '@/types';
import type { User } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Plus, Star, Package } from 'lucide-react';
import { normalizeStringForSearch } from '@/lib/utils';
import { useProductSearch } from '@/hooks/use-smart-search';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface SubmitItemToImport {
  productId: string;
  quantity: number;
  costPriceVND: number;
  priceAction?: 'keep' | 'update';
}

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
  onImportProducts: (
    supplierName: string | undefined,
    itemsToSubmit: SubmitItemToImport[],
    totalCostVND: number,
    employeeId: string,
    employeeName: string
  ) => Promise<boolean>;
}

// Component cho tab "Loại bỏ hàng hỏng" - Phiên bản thông minh với thuộc tính
const SmartDisposalTab: React.FC<{
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
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityToDispose, setQuantityToDispose] = useState<number>(0);
  const [disposalReason, setDisposalReason] = useState<string>('');
  const [isComboboxOpen, setIsComboboxOpen] = useState<boolean>(false);
  
  // Thêm state cho việc chọn thuộc tính riêng lẻ
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Lấy danh sách tên sản phẩm từ inventory
  const availableProductNames = React.useMemo(() => {
    return [...new Set(inventory.filter(p => p.quantity > 0).map(p => p.name))].filter(name => name && name.trim() !== '');
  }, [inventory]);

  // Hàm để lấy các option có sẵn cho một sản phẩm cụ thể
  const getAvailableOptionsForProduct = (productName: string) => {
    if (!productName) {
      return { colors: [], qualities: [], sizes: [], units: [], hasNoQuality: false };
    }
    
    const productsWithSameName = inventory.filter(p => p.name === productName && p.quantity > 0);
    
    // Lọc bỏ giá trị rỗng và undefined/null một cách nghiêm ngặt
    const availableColors = [...new Set(productsWithSameName.map(p => p.color))].filter(color => color && color.trim() !== '') as string[];
    const availableQualities = [...new Set(productsWithSameName.map(p => p.quality))].filter(q => q !== undefined && q !== null && q !== '' && q.trim() !== '') as string[];
    const availableSizes = [...new Set(productsWithSameName.map(p => p.size))].filter(size => size && size.trim() !== '') as string[];
    const availableUnits = [...new Set(productsWithSameName.map(p => p.unit))].filter(unit => unit && unit.trim() !== '') as string[];
    
    // Kiểm tra xem có sản phẩm nào có quality là undefined/null/empty không
    const hasNoQuality = productsWithSameName.some(p => p.quality === undefined || p.quality === null || p.quality === '' || p.quality.trim() === '');

    return {
      colors: availableColors,
      qualities: availableQualities,
      sizes: availableSizes,
      units: availableUnits,
      hasNoQuality: hasNoQuality
    };
  };

  // Xử lý khi chọn tên sản phẩm
  const handleProductNameSelect = (productName: string) => {
    setSelectedProductName(productName);
    setSelectedProduct(null);
    setQuantityToDispose(0);
    
    // Tự động chọn thuộc tính đầu tiên có sẵn
    const options = getAvailableOptionsForProduct(productName);
    setSelectedColor(options.colors.length > 0 ? options.colors[0] : '');
    // Chỉ set quality nếu thực sự có quality options
    if (options.qualities.length > 0) {
      setSelectedQuality(options.hasNoQuality ? 'none' : options.qualities[0]);
    } else {
      setSelectedQuality(''); // Không có quality nào cả
    }
    setSelectedSize(options.sizes.length > 0 ? options.sizes[0] : '');
    setSelectedUnit(options.units.length > 0 ? options.units[0] : '');
  };

  // Xử lý khi thay đổi thuộc tính và tìm sản phẩm phù hợp
  React.useEffect(() => {
    if (selectedProductName && selectedColor && selectedSize && selectedUnit) {
      const options = getAvailableOptionsForProduct(selectedProductName);
      const normalizedQuality = selectedQuality === 'none' ? undefined : selectedQuality;
      
      // Chỉ tìm kiếm nếu tất cả các thuộc tính cần thiết đã được chọn
      const hasRequiredQuality = options.qualities.length === 0 || selectedQuality !== '';
      
      if (hasRequiredQuality) {
        const matchedProduct = inventory.find(p =>
          p.name === selectedProductName &&
          p.color === selectedColor &&
          (p.quality || undefined) === (normalizedQuality || undefined) &&
          p.size === selectedSize &&
          p.unit === selectedUnit &&
          p.quantity > 0
        );
        
        setSelectedProduct(matchedProduct || null);
        setQuantityToDispose(0);
        
        if (matchedProduct) {
          toast({
            title: "Đã tìm thấy sản phẩm",
            description: `${matchedProduct.name} - Tồn kho: ${matchedProduct.quantity}`,
            duration: 2000
          });
        }
      }
    }
  }, [selectedProductName, selectedColor, selectedQuality, selectedSize, selectedUnit, inventory, toast]);

  // Component chọn sản phẩm thông minh cho disposal
  const SmartProductSelectorForDisposal = () => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    
    // Sử dụng hook smart search cho sản phẩm có thể loại bỏ
    const { 
      filteredResults,
      setSearchQuery 
    } = useProductSearch(inventory.filter(p => p.quantity > 0));

    // Cập nhật search query khi localSearchTerm thay đổi
    React.useEffect(() => {
      setSearchQuery(localSearchTerm);
    }, [localSearchTerm, setSearchQuery]);

    // Reset local search term when popover closes
    React.useEffect(() => {
      if (!isComboboxOpen) {
        setLocalSearchTerm('');
        setSearchQuery('');
      }
    }, [isComboboxOpen, setSearchQuery]);

    return (
      <div className="space-y-2">
        <Popover 
          open={isComboboxOpen} 
          onOpenChange={setIsComboboxOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isComboboxOpen}
              className="w-full justify-between h-auto min-h-[40px] p-2"
            >
              <div className="flex flex-col items-start text-left">
                {selectedProduct ? (
                  <>
                    <span className="font-medium">{selectedProduct.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {selectedProduct.color} | {selectedProduct.quality || 'Không CL'} | {selectedProduct.size} | {selectedProduct.unit}
                    </span>
                    <span className="text-xs text-blue-600">
                      Tồn kho: {selectedProduct.quantity} | Giá vốn: {selectedProduct.costPrice ? (selectedProduct.costPrice / 1000).toLocaleString('vi-VN') : '0'} k VNĐ
                    </span>
                  </>
                ) : selectedProductName ? (
                  <>
                    <span className="font-medium">{selectedProductName}</span>
                    <span className="text-xs text-orange-600">
                      Vui lòng chọn đầy đủ thuộc tính bên dưới
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">🔍 Tìm kiếm sản phẩm cần loại bỏ...</span>
                )}
              </div>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Tìm kiếm sản phẩm..." 
                onValueChange={setLocalSearchTerm}
              />
              <CommandList>
                <ScrollArea className="h-[300px]">
                  {localSearchTerm ? (
                    <>
                      <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                      <CommandGroup heading="Kết quả tìm kiếm">
                        {filteredResults.map((result) => {
                          const product = result.item;
                          return (
                            <CommandItem
                              key={product.id}
                              value={`${product.id}-${product.name}`}
                              onSelect={() => {
                                setSelectedProduct(product);
                                setSelectedProductName(product.name);
                                setSelectedColor(product.color);
                                setSelectedQuality(product.quality || 'none');
                                setSelectedSize(product.size);
                                setSelectedUnit(product.unit);
                                setIsComboboxOpen(false);
                                setLocalSearchTerm('');
                                setSearchQuery('');
                                setQuantityToDispose(0);
                                toast({
                                  title: "Đã chọn sản phẩm",
                                  description: `${product.name}`,
                                  duration: 2000
                                });
                              }}
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted"
                            >
                              <span className="font-medium">{product.name}</span>
                              <Badge variant="outline" className="text-xs">Tồn: {product.quantity}</Badge>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </>
                  ) : (
                    <>
                      <CommandGroup heading="Chọn theo tên sản phẩm">
                        {availableProductNames.map(name => {
                          const variantCount = inventory.filter(p => p.name === name && p.quantity > 0).length;
                          return (
                            <CommandItem
                              key={name}
                              value={name}
                              onSelect={() => {
                                handleProductNameSelect(name);
                                setIsComboboxOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              <span>{name}</span>
                              <Badge variant="secondary" className="ml-auto">
                                {variantCount} biến thể
                              </Badge>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                      <CommandGroup heading="Hoặc chọn trực tiếp sản phẩm">
                        {inventory.filter(p => p.quantity > 0).slice(0, 10).map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.id}-${product.name}`}
                            onSelect={() => {
                              setSelectedProduct(product);
                              setSelectedProductName(product.name);
                              setSelectedColor(product.color);
                              setSelectedQuality(product.quality || 'none');
                              setSelectedSize(product.size);
                              setSelectedUnit(product.unit);
                              setIsComboboxOpen(false);
                              setQuantityToDispose(0);
                              toast({
                                title: "Đã chọn sản phẩm",
                                description: `${product.name}`,
                                duration: 2000
                              });
                            }}
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted"
                          >
                            <span className="font-medium text-sm">{product.name}</span>
                            <Badge variant="outline" className="text-xs">Tồn: {product.quantity}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </ScrollArea>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const handleDispose = async () => {
    if (selectedProduct && quantityToDispose > 0 && disposalReason.trim() && currentUser) {
      const productDetails = {
        name: selectedProduct.name,
        color: selectedProduct.color,
        quality: selectedProduct.quality,
        size: selectedProduct.size,
        unit: selectedProduct.unit,
        images: selectedProduct.images
      };
      
      await onDisposeProductItems(
        selectedProduct.id, 
        quantityToDispose, 
        disposalReason, 
        productDetails,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Unknown'
      );
      
      setSelectedProduct(null);
      setSelectedProductName('');
      setSelectedColor('');
      setSelectedQuality('');
      setSelectedSize('');
      setSelectedUnit('');
      setQuantityToDispose(0);
      setDisposalReason('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle className="mr-3 h-6 w-6" />
            Loại bỏ hàng hỏng/không bán được
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chọn sản phẩm thông minh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chọn sản phẩm cần loại bỏ (*)
              </label>
              <SmartProductSelectorForDisposal />
            </div>

            {/* Hiển thị các trường thuộc tính khi đã chọn tên sản phẩm nhưng chưa có sản phẩm cụ thể */}
            {selectedProductName && !selectedProduct && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">
                  Chọn thuộc tính cho sản phẩm: {selectedProductName}
                </h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${getAvailableOptionsForProduct(selectedProductName).qualities.length > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
                  {/* Color */}
                  <div>
                    <label className="block mb-1 text-sm text-foreground">Màu sắc (*)</label>
                    <Select 
                      value={selectedColor} 
                      onValueChange={setSelectedColor}
                    >
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn màu sắc" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOptionsForProduct(selectedProductName).colors.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality - chỉ hiển thị khi có sự lựa chọn về quality */}
                  {getAvailableOptionsForProduct(selectedProductName).qualities.length > 0 && (
                  <div>
                    <label className="block mb-1 text-sm text-foreground">Chất lượng</label>
                    <Select 
                      value={selectedQuality || 'none'} 
                      onValueChange={setSelectedQuality}
                    >
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn chất lượng" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOptionsForProduct(selectedProductName).hasNoQuality && (
                          <SelectItem value="none">Không CL</SelectItem>
                        )}
                        {getAvailableOptionsForProduct(selectedProductName).qualities.map(quality => (
                          <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  )}

                  {/* Size */}
                  <div>
                    <label className="block mb-1 text-sm text-foreground">Kích thước (*)</label>
                    <Select 
                      value={selectedSize} 
                      onValueChange={setSelectedSize}
                    >
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn kích thước" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOptionsForProduct(selectedProductName).sizes.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block mb-1 text-sm text-foreground">Đơn vị (*)</label>
                    <Select 
                      value={selectedUnit} 
                      onValueChange={setSelectedUnit}
                    >
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOptionsForProduct(selectedProductName).units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin sản phẩm đã chọn */}
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số lượng loại bỏ (*)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedProduct.quantity}
                    value={quantityToDispose}
                    onChange={(e) => setQuantityToDispose(parseInt(e.target.value) || 0)}
                    className="w-full"
                    placeholder="Nhập số lượng"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Còn lại: <span className="font-medium">{selectedProduct.quantity}</span>
                  </p>
                </div>

                <div className="flex items-end">
                  <div className="text-sm space-y-1">
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      ✓ Sản phẩm hợp lệ
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      📦 {selectedProduct.name}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedProduct.color}{selectedProduct.quality ? ` | ${selectedProduct.quality}` : ''} | {selectedProduct.size} | {selectedProduct.unit}
                    </p>
                    <p className="text-muted-foreground">
                      Giá trị loại bỏ: <span className="font-medium text-red-600">
                        {selectedProduct.costPrice && quantityToDispose > 0 
                          ? (quantityToDispose * selectedProduct.costPrice).toLocaleString('vi-VN') 
                          : '0'} VNĐ
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lý do loại bỏ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lý do loại bỏ (*)
              </label>
              <Textarea
                value={disposalReason}
                onChange={(e) => setDisposalReason(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Nhập lý do loại bỏ (hàng hỏng, hết hạn, không bán được...)"
              />
            </div>

            {/* Nút xác nhận */}
            <Button
              onClick={handleDispose}
              disabled={!selectedProduct || quantityToDispose <= 0 || !disposalReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận loại bỏ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử loại bỏ - có thể thêm sau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Lịch sử loại bỏ gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">Chức năng này sẽ được phát triển để hiển thị lịch sử loại bỏ hàng hóa.</p>
        </CardContent>
      </Card>
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
            onDisposeProductItems={onDisposeProductItems}
            currentUser={currentUser}
            storefrontProductIds={storefrontProductIds}
            onAddToStorefront={onAddToStorefront}
            onRemoveFromStorefront={onRemoveFromStorefront}
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
          <SmartDisposalTab
            inventory={inventory}
            onDisposeProductItems={onDisposeProductItems}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
