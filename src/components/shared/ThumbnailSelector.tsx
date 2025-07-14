"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Check } from 'lucide-react';
import type { Product } from '@/types';

interface ThumbnailSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[]; // All variants of the same product name
  selectedProduct: Product;
  onThumbnailSelect: (productId: string, thumbnailIndex: number) => void;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  onThumbnailSelect
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Product>(selectedProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedVariant(selectedProduct);
    setSelectedImageIndex(0);
  }, [selectedProduct, isOpen]);

  const handleVariantSelect = (variant: Product) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0);
  };

  const handleImageSelect = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
  };

  const handleConfirm = () => {
    onThumbnailSelect(selectedVariant.id, selectedImageIndex);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn hình đại diện cho sản phẩm</DialogTitle>
          <DialogDescription>
            Chọn thuộc tính sản phẩm và hình ảnh tương ứng làm ảnh đại diện
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Variant Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Chọn thuộc tính sản phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((variant) => (
                <Card
                  key={variant.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedVariant.id === variant.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleVariantSelect(variant)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-md overflow-hidden">
                        <Image
                          src={variant.images?.[0] || 'https://placehold.co/48x48.png'}
                          alt={variant.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/48x48.png';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{variant.name}</span>
                          {selectedVariant.id === variant.id && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {variant.color && (
                            <Badge variant="outline" className="text-xs">{variant.color}</Badge>
                          )}
                          {variant.quality && (
                            <Badge variant="outline" className="text-xs">{variant.quality}</Badge>
                          )}
                          {variant.size && (
                            <Badge variant="outline" className="text-xs">{variant.size}</Badge>
                          )}
                          {variant.unit && (
                            <Badge variant="outline" className="text-xs">{variant.unit}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Image Selection */}
          {selectedVariant && selectedVariant.images && selectedVariant.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Chọn hình ảnh đại diện</h3>
              <div className="space-y-4">
                {/* Main Image Display */}
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedVariant.images[selectedImageIndex] || 'https://placehold.co/600x400.png'}
                    alt={`${selectedVariant.name} - ảnh ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400.png';
                    }}
                  />
                </div>

                {/* Image Thumbnails */}
                {selectedVariant.images.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {selectedVariant.images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                          selectedImageIndex === index
                            ? 'ring-2 ring-primary scale-105'
                            : 'hover:opacity-80'
                        }`}
                        onClick={() => handleImageSelect(index)}
                      >
                        <Image
                          src={image}
                          alt={`${selectedVariant.name} - thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100.png';
                          }}
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary bg-white rounded-full p-1" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Xem trước</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src={
                    selectedVariant.images?.[selectedImageIndex] || 
                    'https://placehold.co/64x64.png'
                  }
                  alt="Preview thumbnail"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/64x64.png';
                  }}
                />
              </div>
              <div>
                <p className="font-medium">{selectedVariant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[
                    selectedVariant.color,
                    selectedVariant.quality,
                    selectedVariant.size,
                    selectedVariant.unit
                  ].filter(Boolean).join(' • ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Hình {selectedImageIndex + 1} / {selectedVariant.images?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleConfirm}>
            Chọn làm ảnh đại diện
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
