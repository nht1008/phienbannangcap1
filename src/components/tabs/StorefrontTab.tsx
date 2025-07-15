"use client";

import React, { useState, useMemo } from 'react';
import { normalizeStringForSearch } from '@/lib/utils';
import type { Product, Invoice } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { Search, ArrowUpDown, ShoppingCart, Eye, Crown, XCircle, Save, CheckCircle, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HeroBanner } from '../storefront/HeroBanner';
import { NoProductsFoundIllustration } from '@/components/illustrations/NoProductsFoundIllustration';
import { getProductThumbnail as getProductThumbnailUtil } from '@/lib/product-thumbnail-utils';
import { Textarea } from '../ui/textarea';
import SeasonalEffects from '../shared/SeasonalEffects';
import { ThumbnailSelector } from '@/components/shared/ThumbnailSelector';
import { useThumbnailSelector } from '@/hooks/use-thumbnail-selector';

// New ProductCard component
const ProductCard = ({
  product,
  isTopSeller,
  onViewDetails,
  isCustomerView,
  hasFullAccessRights,
  onRemoveFromStorefront,
  onThumbnailClick,
  getProductThumbnail,
}: {
  product: Product;
  isTopSeller: boolean;
  onViewDetails: (product: Product) => void;
  isCustomerView: boolean;
  hasFullAccessRights: boolean;
  onRemoveFromStorefront: (productId: string) => Promise<void>;
  onThumbnailClick?: (product: Product, event: React.MouseEvent) => void;
  getProductThumbnail: (product: Product) => string;
}) => {
  const { toast } = useToast();

  return (
    <Card
      className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <CardHeader className="p-0 relative">
        <div className="aspect-square w-full overflow-hidden relative" onClick={() => onViewDetails(product)}>
          {hasFullAccessRights && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await onRemoveFromStorefront(product.id);
                  toast({ title: "Thành công", description: "Đã loại sản phẩm khỏi gian hàng." });
                } catch (error) {
                  toast({ title: "Lỗi", description: "Không thể loại sản phẩm khỏi gian hàng.", variant: "destructive" });
                }
              }}
              title="Loại khỏi gian hàng"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          <Image
            src={getProductThumbnail(product)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Thumbnail selector button */}
          {hasFullAccessRights && onThumbnailClick && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 left-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => onThumbnailClick(product, e)}
              title="Chọn hình đại diện"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
          
          <div className="absolute inset-0 p-4 flex flex-col">
            <div className="flex-grow">
              <div className="flex flex-col gap-1 items-start">
                {isTopSeller && (
                    <div className="flex items-center bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        <Crown className="h-3 w-3 mr-1" />
                        Bán chạy
                    </div>
                )}
              </div>
            </div>
            <div className="text-white">
              <CardTitle className="text-lg font-bold whitespace-normal break-words" title={product.name}>
                  {product.name}
              </CardTitle>
              <p className="text-base font-semibold text-amber-300">
                {product.price.toLocaleString('vi-VN')} VNĐ
              </p>
              <p className={`text-xs font-medium ${product.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {product.quantity > 0 ? '● Còn hàng' : '○ Hết hàng'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

// New ProductDetailDialog
const ProductDetailDialog = ({
    product,
    isOpen,
    onClose,
    onAddToCart,
    inventory,
    isCustomerView,
    hasFullAccessRights,
    onSaveDescription,
    colorOptions,
    productQualityOptions,
    sizeOptions,
    unitOptions
}: {
    product: Product | null,
    isOpen: boolean,
    onClose: () => void,
    onAddToCart: (product: Product) => void,
    inventory: Product[],
    isCustomerView: boolean,
    hasFullAccessRights: boolean,
    onSaveDescription: (productId: string, description: string) => Promise<void>;
    colorOptions: string[];
    productQualityOptions: string[];
    sizeOptions: string[];
    unitOptions: string[];
}) => {
    const { toast } = useToast();
    const [selectedColor, setSelectedColor] = useState<string | undefined>();
    const [selectedSize, setSelectedSize] = useState<string | undefined>();
    const [selectedQuality, setSelectedQuality] = useState<string | undefined>();
    const [selectedUnit, setSelectedUnit] = useState<string | undefined>();
    const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [api, setApi] = useState<CarouselApi>();

    const productVariations = useMemo(() => {
        if (!product) return [];
        return inventory.filter(p => p.name === product.name);
    }, [inventory, product]);

    React.useEffect(() => {
        if (product) {
            setSelectedVariant(product);
            setSelectedColor(product.color);
            setSelectedSize(product.size);
            setSelectedQuality(product.quality);
            setSelectedUnit(product.unit);
            setDescription(product.description || '');
        }
    }, [product]);

    // Lấy các thuộc tính có sẵn dựa trên cấu hình
    const availableColors = useMemo(() => {
        if (colorOptions.length === 0) return [];
        return [...new Set(productVariations
            .map(p => p.color)
            .filter((c): c is string => Boolean(c && c.trim() !== '' && colorOptions.includes(c)))
        )];
    }, [productVariations, colorOptions]);
    
    const availableSizes = useMemo(() => {
        if (sizeOptions.length === 0) return [];
        let filteredVariations = productVariations;
        if (selectedColor && colorOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.color === selectedColor);
        }
        return [...new Set(filteredVariations
            .map(p => p.size)
            .filter((s): s is string => Boolean(s && s.trim() !== '' && sizeOptions.includes(s)))
        )];
    }, [productVariations, selectedColor, colorOptions, sizeOptions]);

    const availableQualities = useMemo(() => {
        if (productQualityOptions.length === 0) return [];
        let filteredVariations = productVariations;
        if (selectedColor && colorOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.color === selectedColor);
        }
        if (selectedSize && sizeOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.size === selectedSize);
        }
        return [...new Set(filteredVariations
            .map(p => p.quality)
            .filter((q): q is string => Boolean(q && q.trim() !== '' && productQualityOptions.includes(q)))
        )];
    }, [productVariations, selectedColor, selectedSize, colorOptions, sizeOptions, productQualityOptions]);

    const availableUnits = useMemo(() => {
        if (unitOptions.length === 0) return [];
        let filteredVariations = productVariations;
        if (selectedColor && colorOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.color === selectedColor);
        }
        if (selectedSize && sizeOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.size === selectedSize);
        }
        if (selectedQuality && productQualityOptions.length > 0) {
            filteredVariations = filteredVariations.filter(p => p.quality === selectedQuality);
        }
        return [...new Set(filteredVariations
            .map(p => p.unit)
            .filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u)))
        )];
    }, [productVariations, selectedColor, selectedSize, selectedQuality, colorOptions, sizeOptions, productQualityOptions, unitOptions]);

    React.useEffect(() => {
        const variant = productVariations.find(p => {
            const colorMatch = colorOptions.length === 0 || !selectedColor || p.color === selectedColor;
            const sizeMatch = sizeOptions.length === 0 || !selectedSize || p.size === selectedSize;
            const qualityMatch = productQualityOptions.length === 0 || !selectedQuality || p.quality === selectedQuality;
            const unitMatch = unitOptions.length === 0 || !selectedUnit || p.unit === selectedUnit;
            return colorMatch && sizeMatch && qualityMatch && unitMatch;
        });
        if (variant) {
            setSelectedVariant(variant);
        }
    }, [selectedColor, selectedSize, selectedQuality, selectedUnit, productVariations, colorOptions, sizeOptions, productQualityOptions, unitOptions]);

    const handleColorChange = (newColor: string) => {
        setSelectedColor(newColor);
        
        // LOGIC MỚI: Tìm variant phù hợp nhất giữ nguyên các thuộc tính đã chọn
        // Ưu tiên tìm variant có cùng thuộc tính đã chọn, chỉ thay đổi khi không tìm thấy
        const variantsWithColor = productVariations.filter(p => p.color === newColor);
        
        if (variantsWithColor.length > 0) {
            // Tìm variant có cùng chất lượng, kích thước, đơn vị đã chọn
            let bestMatch = variantsWithColor.find(p => 
                (!selectedQuality || p.quality === selectedQuality) &&
                (!selectedSize || p.size === selectedSize) &&
                (!selectedUnit || p.unit === selectedUnit)
            );
            
            // Nếu không tìm thấy match hoàn hảo, tìm match từng phần
            if (!bestMatch) {
                // Ưu tiên giữ chất lượng + kích thước
                bestMatch = variantsWithColor.find(p => 
                    (!selectedQuality || p.quality === selectedQuality) &&
                    (!selectedSize || p.size === selectedSize)
                );
            }
            
            // Nếu vẫn không có, ưu tiên giữ chất lượng
            if (!bestMatch) {
                bestMatch = variantsWithColor.find(p => 
                    (!selectedQuality || p.quality === selectedQuality)
                );
            }
            
            // Cuối cùng mới lấy variant đầu tiên
            if (!bestMatch) {
                bestMatch = variantsWithColor[0];
            }
            
            // Chỉ cập nhật những thuộc tính cần thiết khi không tìm thấy variant phù hợp
            if (bestMatch) {
                // Chỉ cập nhật kích thước nếu không tồn tại trong danh sách available hoặc variant hiện tại không có
                const newAvailableSizes = [...new Set(variantsWithColor
                    .filter(p => (!selectedQuality || p.quality === selectedQuality))
                    .map(p => p.size)
                    .filter((s): s is string => Boolean(s && s.trim() !== '' && sizeOptions.includes(s)))
                )];
                
                if (sizeOptions.length > 0 && (!selectedSize || !newAvailableSizes.includes(selectedSize))) {
                    setSelectedSize(bestMatch.size || '');
                }
                
                // Tương tự cho chất lượng
                const newAvailableQualities = [...new Set(variantsWithColor
                    .filter(p => (!selectedSize || p.size === selectedSize))
                    .map(p => p.quality)
                    .filter((q): q is string => Boolean(q && q.trim() !== '' && productQualityOptions.includes(q)))
                )];
                
                if (productQualityOptions.length > 0 && (!selectedQuality || !newAvailableQualities.includes(selectedQuality))) {
                    setSelectedQuality(bestMatch.quality || '');
                }
                
                // Tương tự cho đơn vị
                const newAvailableUnits = [...new Set(variantsWithColor
                    .filter(p => 
                        (!selectedQuality || p.quality === selectedQuality) &&
                        (!selectedSize || p.size === selectedSize)
                    )
                    .map(p => p.unit)
                    .filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u)))
                )];
                
                if (unitOptions.length > 0 && (!selectedUnit || !newAvailableUnits.includes(selectedUnit))) {
                    setSelectedUnit(bestMatch.unit || '');
                }
            }
        }
    };

    const handleSizeChange = (newSize: string) => {
        setSelectedSize(newSize);
        
        // LOGIC MỚI: Tìm variant phù hợp nhất giữ nguyên các thuộc tính đã chọn
        let filteredVariants = productVariations.filter(p => p.size === newSize);
        if (selectedColor && colorOptions.length > 0) {
            filteredVariants = filteredVariants.filter(p => p.color === selectedColor);
        }
        
        if (filteredVariants.length > 0) {
            // Tìm variant có cùng chất lượng và đơn vị đã chọn
            let bestMatch = filteredVariants.find(p => 
                (!selectedQuality || p.quality === selectedQuality) &&
                (!selectedUnit || p.unit === selectedUnit)
            );
            
            // Nếu không tìm thấy, ưu tiên giữ chất lượng
            if (!bestMatch) {
                bestMatch = filteredVariants.find(p => 
                    (!selectedQuality || p.quality === selectedQuality)
                );
            }
            
            // Cuối cùng mới lấy variant đầu tiên
            if (!bestMatch) {
                bestMatch = filteredVariants[0];
            }
            
            if (bestMatch) {
                // Chỉ cập nhật chất lượng nếu không tồn tại trong danh sách available
                const newAvailableQualities = [...new Set(filteredVariants
                    .map(p => p.quality)
                    .filter((q): q is string => Boolean(q && q.trim() !== '' && productQualityOptions.includes(q)))
                )];
                
                if (productQualityOptions.length > 0 && (!selectedQuality || !newAvailableQualities.includes(selectedQuality))) {
                    setSelectedQuality(bestMatch.quality || '');
                }
                
                // Tương tự cho đơn vị
                const newAvailableUnits = [...new Set(filteredVariants
                    .filter(p => (!selectedQuality || p.quality === selectedQuality))
                    .map(p => p.unit)
                    .filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u)))
                )];
                
                if (unitOptions.length > 0 && (!selectedUnit || !newAvailableUnits.includes(selectedUnit))) {
                    setSelectedUnit(bestMatch.unit || '');
                }
            }
        }
    };

    const handleQualityChange = (newQuality: string) => {
        setSelectedQuality(newQuality);
        
        // LOGIC MỚI: Tìm variant phù hợp nhất giữ nguyên các thuộc tính đã chọn
        let filteredVariants = productVariations.filter(p => p.quality === newQuality);
        if (selectedColor && colorOptions.length > 0) {
            filteredVariants = filteredVariants.filter(p => p.color === selectedColor);
        }
        if (selectedSize && sizeOptions.length > 0) {
            filteredVariants = filteredVariants.filter(p => p.size === selectedSize);
        }
        
        if (filteredVariants.length > 0) {
            // Tìm variant có cùng đơn vị đã chọn
            let bestMatch = filteredVariants.find(p => 
                (!selectedUnit || p.unit === selectedUnit)
            );
            
            // Nếu không tìm thấy, lấy variant đầu tiên
            if (!bestMatch) {
                bestMatch = filteredVariants[0];
            }
            
            if (bestMatch && unitOptions.length > 0) {
                // Chỉ cập nhật đơn vị nếu không tồn tại trong danh sách available
                const newAvailableUnits = [...new Set(filteredVariants
                    .map(p => p.unit)
                    .filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u)))
                )];
                
                if (!selectedUnit || !newAvailableUnits.includes(selectedUnit)) {
                    setSelectedUnit(bestMatch.unit || '');
                }
            }
        }
    };

    const handleUnitChange = (newUnit: string) => {
        setSelectedUnit(newUnit);
    };
    
    const handleSave = async () => {
        if (!selectedVariant) return;
        setIsSaving(true);
        try {
            await onSaveDescription(selectedVariant.id, description);
            toast({ title: "Thành công", description: "Đã cập nhật mô tả sản phẩm." });
            onClose();
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể cập nhật mô tả.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !product || !selectedVariant) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-2xl w-full max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                        <div className="w-full md:w-3/5 flex flex-col gap-4">
                            <Carousel setApi={setApi} className="w-full relative">
                                <CarouselContent>
                                    {(selectedVariant.images && selectedVariant.images.length > 0 ? selectedVariant.images : [`https://placehold.co/600x600.png`]).map((img, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative flex-grow min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
                                                <Image
                                                    src={img}
                                                    alt={`${selectedVariant.name} - image ${index + 1}`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 60vw"
                                                    className="rounded-lg object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600.png'; }}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground" />
                                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground" />
                            </Carousel>
                        </div>
                        <div className="w-full md:w-2/5 flex flex-col">
                            <h2 className="text-2xl lg:text-3xl font-bold mb-2">{selectedVariant.name}</h2>
                            <p className="text-2xl lg:text-3xl font-bold text-white bg-green-500 p-2 rounded mb-4 inline-block w-fit">{selectedVariant.price.toLocaleString('vi-VN')} VNĐ</p>
                            
                            <div className="space-y-4 mb-4">
                                {availableColors.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Màu sắc</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableColors.map(color => (
                                                <Button key={color} variant={selectedColor === color ? 'default' : 'outline'} onClick={() => handleColorChange(color)} className="h-12 px-6 text-base">{color}</Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {availableSizes.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Kích thước</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSizes.map(size => (
                                                <Button key={size} variant={selectedSize === size ? 'default' : 'outline'} onClick={() => handleSizeChange(size)} className="h-12 px-6 text-base">{size}</Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {availableQualities.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Chất lượng</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableQualities.map(quality => (
                                                <Button key={quality} variant={selectedQuality === quality ? 'default' : 'outline'} onClick={() => handleQualityChange(quality)} className="h-12 px-6 text-base">{quality}</Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {availableUnits.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Đơn vị</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableUnits.map(unit => (
                                                <Button key={unit} variant={selectedUnit === unit ? 'default' : 'outline'} onClick={() => handleUnitChange(unit)} className="h-12 px-6 text-base">{unit}</Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Mô tả</h3>
                                {hasFullAccessRights ? (
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Nhập mô tả sản phẩm..."
                                        className="min-h-[100px]"
                                    />
                                ) : (
                                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{description || "Sản phẩm này chưa có mô tả."}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 border-t p-4 bg-card">
                    <div className="flex gap-4">
                        {isCustomerView ? (
                          <Button
                            size="lg"
                            className="flex-1"
                            onClick={() => {
                              onAddToCart(selectedVariant);
                              setIsAdded(true);
                              setTimeout(() => {
                                onClose();
                                setIsAdded(false);
                              }, 1000);
                            }}
                            disabled={selectedVariant.quantity <= 0 || isAdded}
                          >
                            {isAdded ? (
                              <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Đã thêm
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {selectedVariant.quantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                              </>
                            )}
                          </Button>
                        ) : (
                            <div className="flex-grow" />
                        )}
                        
                        {hasFullAccessRights && !isCustomerView && (
                            <Button size="lg" onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-5 w-5" />
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        )}
                        <Button size="lg" variant="outline" onClick={onClose}>Đóng</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface StorefrontTabProps {
  inventory: Product[];
  invoices: Invoice[];
  onAddToCart: (product: Product) => void;
  isCustomerView: boolean;
  hasFullAccessRights: boolean;
  onRemoveFromStorefront: (productId: string) => Promise<void>;
  onSaveDescription: (productId: string, description: string) => Promise<void>;
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onUpdateThumbnail?: (productId: string, thumbnailImage: string) => Promise<void>;
}

export default function StorefrontTab({ 
  inventory, 
  invoices, 
  onAddToCart, 
  isCustomerView, 
  hasFullAccessRights, 
  onRemoveFromStorefront, 
  onSaveDescription,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  onUpdateThumbnail
}: StorefrontTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('sold-desc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  
  // Multi-tag search states
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Thumbnail selector
  const { thumbnailState, openThumbnailSelector, closeThumbnailSelector } = useThumbnailSelector();
  const { toast } = useToast();

  // Thumbnail selection handlers
  const handleThumbnailClick = React.useCallback((product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    const variantsOfProduct = inventory.filter(p => p.name === product.name);
    if (variantsOfProduct.length === 0) return;
    
    openThumbnailSelector(product.name, variantsOfProduct, product);
  }, [inventory, openThumbnailSelector]);

  const handleThumbnailSelect = React.useCallback(async (productId: string, thumbnailIndex: number) => {
    if (!onUpdateThumbnail) return;
    
    const product = inventory.find(p => p.id === productId);
    if (!product || !product.images || !product.images[thumbnailIndex]) return;
    
    try {
      await onUpdateThumbnail(productId, product.images[thumbnailIndex]);
      toast({
        title: "Thành công",
        description: "Đã cập nhật hình đại diện sản phẩm.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hình đại diện.",
        variant: "destructive",
      });
    }
  }, [inventory, onUpdateThumbnail, toast]);

  const getProductThumbnail = React.useCallback((product: Product) => {
    return getProductThumbnailUtil(product, inventory);
  }, [inventory]);

  const productSales = useMemo(() => {
    const salesMap: Record<string, number> = {};
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        salesMap[item.id] = (salesMap[item.id] || 0) + item.quantityInCart;
      });
    });
    return salesMap;
  }, [invoices]);

  const topSellingProductIds = useMemo(() => {
    return Object.entries(productSales)
      .sort(([, salesA], [, salesB]) => salesB - salesA)
      .slice(0, 10) // Mark top 10 as best sellers
      .map(([productId]) => productId);
  }, [productSales]);

  const groupedProductsByName = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    inventory.forEach(p => {
      if (!groups[p.name]) {
        groups[p.name] = [];
      }
      groups[p.name].push(p);
    });
    return groups;
  }, [inventory]);

  // Generate smart search suggestions (without batch logic)
  const generateSearchSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    
    inventory.forEach(item => {
      // Add product name
      if (item.name) suggestions.add(item.name);
      
      // Add color
      if (item.color) suggestions.add(item.color);
      
      // Add quality
      if (item.quality) suggestions.add(item.quality);
      
      // Add size
      if (item.size) suggestions.add(item.size);
      
      // Add unit
      if (item.unit) suggestions.add(item.unit);
      
      // Add price ranges
      const price = item.price;
      if (price < 50000) suggestions.add('Dưới 50k');
      else if (price < 100000) suggestions.add('50k-100k');
      else if (price < 200000) suggestions.add('100k-200k');
      else suggestions.add('Trên 200k');
    });
    
    // Add common keywords (without batch-related ones)
    suggestions.add('Hết hàng');
    suggestions.add('Còn hàng');
    suggestions.add('Bán chạy');
    suggestions.add('Sản phẩm mới');
    
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'vi-VN'));
  }, [inventory]);

  const filteredAndSortedGroups = useMemo(() => {
    let productGroups = Object.values(groupedProductsByName);

    // Apply filters from selected tags and search input
    const allSearchTerms = [...selectedFilters, searchTerm.trim()].filter(Boolean);
    if (allSearchTerms.length > 0) {
      productGroups = productGroups.filter(group => {
        return allSearchTerms.every(searchTerm => {
          const normalizedTerm = normalizeStringForSearch(searchTerm);
          
          // Check against product properties in the group
          return group.some(variant => {
            const searchableText = normalizeStringForSearch([
              variant.name,
              variant.color,
              variant.quality,
              variant.size,
              variant.unit,
              variant.quantity > 0 ? 'Còn hàng' : 'Hết hàng',
              // Price range checking
              variant.price < 50000 ? 'Dưới 50k' : 
              variant.price < 100000 ? '50k-100k' : 
              variant.price < 200000 ? '100k-200k' : 'Trên 200k'
            ].filter(Boolean).join(' '));
            
            return searchableText.includes(normalizedTerm);
          });
        });
      });
    }

    productGroups.sort((groupA, groupB) => {
      const nameA = groupA[0].name;
      const nameB = groupB[0].name;

      switch (sortBy) {
        case 'price-asc':
          const minPriceA = Math.min(...groupA.map(p => p.price));
          const minPriceB = Math.min(...groupB.map(p => p.price));
          return minPriceA - minPriceB;
        case 'price-desc':
          const maxPriceA = Math.max(...groupA.map(p => p.price));
          const maxPriceB = Math.max(...groupB.map(p => p.price));
          return maxPriceB - maxPriceA;
        case 'name-asc':
          return nameA.localeCompare(nameB);
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'sold-desc':
          const salesA = groupA.reduce((sum, p) => sum + (productSales[p.id] || 0), 0);
          const salesB = groupB.reduce((sum, p) => sum + (productSales[p.id] || 0), 0);
          return salesB - salesA;
        default:
          return 0;
      }
    });

    return productGroups;
  }, [groupedProductsByName, selectedFilters, searchTerm, sortBy, productSales]);

  // Smart suggestion handling
  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      const normalizedValue = normalizeStringForSearch(value);
      const filteredSuggestions = generateSearchSuggestions.filter(suggestion =>
        normalizeStringForSearch(suggestion).includes(normalizedValue) &&
        !selectedFilters.includes(suggestion) // Exclude already selected filters
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSearchSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select suggestion and add to filter
  const handleSuggestionClick = (suggestion: string) => {
    if (!selectedFilters.includes(suggestion)) {
      setSelectedFilters([...selectedFilters, suggestion]);
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Remove filter
  const removeFilter = (filterToRemove: string) => {
    setSelectedFilters(selectedFilters.filter(filter => filter !== filterToRemove));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSearchTerm('');
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailViewOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailViewOpen(false);
    setSelectedProduct(null);
  };


  return (
    <div className="space-y-6">
      <div>
        <Card className="relative overflow-hidden">
          <SeasonalEffects />
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Sản phẩm nổi bật</CardTitle>
          <CardDescription>Khám phá các sản phẩm của chúng tôi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              
              {/* Filter tags display */}
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
                placeholder={selectedFilters.length > 0 ? "Thêm bộ lọc..." : "Tìm kiếm sản phẩm theo tên, màu sắc, chất lượng, kích thước..."}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => searchTerm.trim().length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {/* Smart suggestions dropdown */}
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
            <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="sold-desc">Bán chạy nhất</SelectItem>
                        <SelectItem value="price-desc">Giá: Cao đến thấp</SelectItem>
                        <SelectItem value="price-asc">Giá: Thấp đến cao</SelectItem>
                        <SelectItem value="name-asc">Tên: A-Z</SelectItem>
                        <SelectItem value="name-desc">Tên: Z-A</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          {filteredAndSortedGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredAndSortedGroups.map(productGroup => {
                const representativeProduct = productGroup[0];
                const isGroupTopSeller = productGroup.some(variant => topSellingProductIds.includes(variant.id));
                
                return (
                  <ProductCard
                    key={representativeProduct.name}
                    product={representativeProduct}
                    isTopSeller={isGroupTopSeller}
                    onViewDetails={handleViewDetails}
                    isCustomerView={isCustomerView}
                    hasFullAccessRights={hasFullAccessRights}
                    onRemoveFromStorefront={onRemoveFromStorefront}
                    onThumbnailClick={onUpdateThumbnail ? handleThumbnailClick : undefined}
                    getProductThumbnail={getProductThumbnail}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <NoProductsFoundIllustration />
                <h3 className="text-xl font-semibold">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground">
                  {selectedFilters.length > 0 || searchTerm ? 
                    `Không có sản phẩm nào phù hợp với bộ lọc "${[...selectedFilters, searchTerm].filter(Boolean).join(', ')}".` : 
                    'Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={isDetailViewOpen}
        onClose={handleCloseDetails}
        onAddToCart={onAddToCart}
        inventory={inventory}
        isCustomerView={isCustomerView}
        hasFullAccessRights={hasFullAccessRights}
        onSaveDescription={onSaveDescription}
        colorOptions={colorOptions}
        productQualityOptions={productQualityOptions}
        sizeOptions={sizeOptions}
        unitOptions={unitOptions}
      />

      {/* Thumbnail Selector Dialog */}
      <ThumbnailSelector
        isOpen={thumbnailState.isOpen}
        onClose={closeThumbnailSelector}
        products={thumbnailState.products}
        selectedProduct={thumbnailState.selectedProduct!}
        onThumbnailSelect={handleThumbnailSelect}
      />
    </div>
  );
}
