
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Plus, Minus } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';

interface VariantSelection {
  color: string;
  quality: string;
  size: string;
  unit: string;
}

interface AvailableVariants {
  colors: string[];
  qualities: string[];
  sizes: string[];
  units: string[];
}

interface ProductOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productGroup: Product[] | null;
  onAddToCart: (product: Product, quantity: number, notes: string) => void;
}

export function ProductOrderDialog({ isOpen, onClose, productGroup, onAddToCart }: ProductOrderDialogProps) {
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({ color: '', quality: '', size: '', unit: '' });
  const [availableVariants, setAvailableVariants] = useState<AvailableVariants>({ colors: [], qualities: [], sizes: [], units: [] });
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const productName = productGroup && productGroup.length > 0 ? productGroup[0].name : '';

  useEffect(() => {
    if (isOpen && productGroup) {
      const inStockVariants = productGroup.filter(p => p.quantity > 0);
      const colors = Array.from(new Set(inStockVariants.map(p => p.color))).sort();
      setAvailableVariants({ colors, qualities: [], sizes: [], units: [] });
      setVariantSelection({ color: colors[0] || '', quality: '', size: '', unit: '' });
      setQuantity('1');
      setNotes('');
    }
  }, [isOpen, productGroup]);
  
  // Chained useEffects for dependent dropdowns
  useEffect(() => {
    if (productGroup && variantSelection.color) {
      const variantsMatching = productGroup.filter(p => p.color === variantSelection.color && p.quantity > 0);
      const qualities = Array.from(new Set(variantsMatching.map(p => p.quality).filter((q): q is string => q !== undefined && typeof q === 'string' && q.trim() !== ''))).sort();
      setAvailableVariants(prev => ({ ...prev, qualities }));
      if (!qualities.includes(variantSelection.quality)) {
        setVariantSelection(prev => ({ ...prev, quality: qualities[0] || '', size: '', unit: '' }));
      }
    }
  }, [productGroup, variantSelection.color]);

  useEffect(() => {
    if (productGroup && variantSelection.color && variantSelection.quality !== undefined) {
      const variantsMatching = productGroup.filter(p => p.color === variantSelection.color && p.quality === variantSelection.quality && p.quantity > 0);
      const sizes = Array.from(new Set(variantsMatching.map(p => p.size))).sort();
      setAvailableVariants(prev => ({ ...prev, sizes }));
       if (!sizes.includes(variantSelection.size)) {
        setVariantSelection(prev => ({ ...prev, size: sizes[0] || '', unit: '' }));
      }
    }
  }, [productGroup, variantSelection.color, variantSelection.quality]);

   useEffect(() => {
    if (productGroup && variantSelection.color && variantSelection.quality !== undefined && variantSelection.size) {
      const variantsMatching = productGroup.filter(p => p.color === variantSelection.color && p.quality === variantSelection.quality && p.size === variantSelection.size && p.quantity > 0);
      const units = Array.from(new Set(variantsMatching.map(p => p.unit))).sort();
      setAvailableVariants(prev => ({ ...prev, units }));
      if (!units.includes(variantSelection.unit)) {
        setVariantSelection(prev => ({ ...prev, unit: units[0] || '' }));
      }
    }
  }, [productGroup, variantSelection.color, variantSelection.quality, variantSelection.size]);


  const selectedVariant = useMemo(() => {
    if (!productGroup) return null;
    return productGroup.find(p =>
      p.color === variantSelection.color &&
      p.quality === variantSelection.quality &&
      p.size === variantSelection.size &&
      p.unit === variantSelection.unit &&
      p.quantity > 0
    );
  }, [productGroup, variantSelection]);

  const handleVariantChange = (field: keyof VariantSelection, value: string) => {
    if (!productGroup) return;
    
    setVariantSelection(prev => {
      const newState = { ...prev, [field]: value };
      
      // LOGIC MỚI: Không reset tự động, chỉ reset khi thực sự cần thiết
      if (field === 'color') {
        // Khi thay đổi màu, kiểm tra xem các thuộc tính khác có còn valid không
        const variantsWithNewColor = productGroup.filter(p => p.color === value && p.quantity > 0);
        
        // Kiểm tra chất lượng hiện tại có còn valid không
        if (prev.quality) {
          const hasValidQuality = variantsWithNewColor.some(p => p.quality === prev.quality);
          if (!hasValidQuality) {
            newState.quality = ''; // Chỉ reset khi không còn valid
          }
        }
        
        // Kiểm tra kích thước hiện tại có còn valid không
        if (prev.size) {
          const filteredByColorQuality = variantsWithNewColor.filter(p => 
            !newState.quality || p.quality === newState.quality
          );
          const hasValidSize = filteredByColorQuality.some(p => p.size === prev.size);
          if (!hasValidSize) {
            newState.size = ''; // Chỉ reset khi không còn valid
          }
        }
        
        // Kiểm tra đơn vị hiện tại có còn valid không
        if (prev.unit) {
          const filteredByColorQualitySize = variantsWithNewColor.filter(p => 
            (!newState.quality || p.quality === newState.quality) &&
            (!newState.size || p.size === newState.size)
          );
          const hasValidUnit = filteredByColorQualitySize.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = ''; // Chỉ reset khi không còn valid
          }
        }
      } else if (field === 'quality') {
        // Tương tự cho chất lượng
        const variantsWithColorQuality = productGroup.filter(p => 
          p.color === prev.color && p.quality === value && p.quantity > 0
        );
        
        if (prev.size) {
          const hasValidSize = variantsWithColorQuality.some(p => p.size === prev.size);
          if (!hasValidSize) {
            newState.size = '';
          }
        }
        
        if (prev.unit) {
          const filteredBySizeAsWell = variantsWithColorQuality.filter(p => 
            !newState.size || p.size === newState.size
          );
          const hasValidUnit = filteredBySizeAsWell.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = '';
          }
        }
      } else if (field === 'size') {
        // Tương tự cho kích thước
        const variantsWithColorQualitySize = productGroup.filter(p => 
          p.color === prev.color && 
          (!prev.quality || p.quality === prev.quality) && 
          p.size === value && 
          p.quantity > 0
        );
        
        if (prev.unit) {
          const hasValidUnit = variantsWithColorQualitySize.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = '';
          }
        }
      }
      
      return newState;
    });
  };

  const handleQuantityChange = (value: string) => {
    if (value === '') {
        setQuantity('');
        return;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && selectedVariant) {
      if (numValue > selectedVariant.quantity) {
        setQuantity(selectedVariant.quantity.toString());
        toast({ title: "Số lượng vượt tồn kho", description: `Chỉ còn ${selectedVariant.quantity} sản phẩm.`, variant: "destructive" });
      } else if (numValue < 1) {
        setQuantity('1');
      } else {
        setQuantity(numValue.toString());
      }
    }
  };

  const handleConfirmAddToCart = () => {
    const numQuantity = parseInt(quantity, 10);
    if (!selectedVariant) {
      toast({ title: "Lỗi", description: "Vui lòng chọn một phiên bản sản phẩm hợp lệ.", variant: "destructive" });
      return;
    }
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ title: "Lỗi", description: "Số lượng phải là một số lớn hơn 0.", variant: "destructive" });
      return;
    }
    if (numQuantity > selectedVariant.quantity) {
      toast({ title: "Lỗi", description: `Số lượng đặt hàng không thể vượt quá số lượng tồn kho (${selectedVariant.quantity}).`, variant: "destructive" });
      return;
    }

    onAddToCart(selectedVariant, numQuantity, notes);
    onClose();
  };

  if (!isOpen || !productGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Đặt hàng: {productName}</DialogTitle>
          <DialogDescription>
            Kiểm tra thông tin sản phẩm, chọn thuộc tính và số lượng để thêm vào giỏ hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 lg:grid-cols-[3fr_2fr] gap-6 py-4 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-2">
                <Carousel setApi={setCarouselApi} className="w-full relative">
                    <CarouselContent>
                        {(
                          (selectedVariant?.images && selectedVariant.images.length > 0)
                            ? selectedVariant.images
                            : (productGroup?.[0]?.images && productGroup[0].images.length > 0)
                              ? productGroup[0].images
                              : [`https://placehold.co/600x600.png`]
                        ).map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="relative flex-grow min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
                                    <Image
                                        src={img}
                                        alt={`${productName} - ảnh ${index + 1}`}
                                        fill
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
            <ScrollArea className="max-h-[60vh] space-y-4 pr-3">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="color-select">Màu sắc</Label>
                        <Select value={variantSelection.color} onValueChange={v => handleVariantChange('color', v)}><SelectTrigger id="color-select"><SelectValue placeholder="Chọn màu" /></SelectTrigger><SelectContent>{availableVariants.colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                    </div>
                    {availableVariants.qualities.length > 0 && availableVariants.qualities.some(q => q) && (
                        <div className="space-y-2">
                            <Label htmlFor="quality-select">Chất lượng</Label>
                            <Select value={variantSelection.quality} onValueChange={v => handleVariantChange('quality', v)}><SelectTrigger id="quality-select"><SelectValue placeholder="Chọn chất lượng" /></SelectTrigger><SelectContent>{availableVariants.qualities.filter(q => q).map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="size-select">Kích thước</Label>
                        <Select value={variantSelection.size} onValueChange={v => handleVariantChange('size', v)}><SelectTrigger id="size-select"><SelectValue placeholder="Chọn kích thước" /></SelectTrigger><SelectContent>{availableVariants.sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="unit-select">Đơn vị</Label>
                        <Select value={variantSelection.unit} onValueChange={v => handleVariantChange('unit', v)}><SelectTrigger id="unit-select"><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger><SelectContent>{availableVariants.units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
                    </div>
                </div>

                <Separator className="my-4"/>

                {selectedVariant ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Đơn giá</p>
                            <p className="text-4xl font-bold text-primary">{`${selectedVariant.price.toLocaleString('vi-VN')} VNĐ`}</p>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-muted-foreground">Tồn kho:</span>
                            <span className="font-medium text-lg">{selectedVariant.quantity} {selectedVariant.unit}</span>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="font-semibold">Số lượng đặt (*)</Label>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange((parseInt(quantity, 10) - 1).toString())} disabled={parseInt(quantity, 10) <= 1}><Minus className="h-5 w-5" /></Button>
                                <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(e.target.value)} min="1" max={selectedVariant.quantity.toString()} required className="w-20 text-center hide-number-spinners text-xl h-10"/>
                                <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange((parseInt(quantity, 10) + 1).toString())} disabled={parseInt(quantity, 10) >= selectedVariant.quantity}><Plus className="h-5 w-5" /></Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="notes">Ghi chú</Label>
                            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ví dụ: Giao hàng sau 5 giờ chiều..." className="min-h-[80px]"/>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">Vui lòng chọn đầy đủ thuộc tính để xem thông tin.</div>
                )}
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="lg">Hủy</Button>
          <Button onClick={handleConfirmAddToCart} className="bg-primary text-primary-foreground" disabled={!selectedVariant} size="lg">
             Thêm vào giỏ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
