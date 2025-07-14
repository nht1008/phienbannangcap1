import { useState, useCallback } from 'react';
import type { Product } from '@/types';

interface ThumbnailState {
  isOpen: boolean;
  productName: string;
  products: Product[];
  selectedProduct: Product | null;
}

export const useThumbnailSelector = () => {
  const [thumbnailState, setThumbnailState] = useState<ThumbnailState>({
    isOpen: false,
    productName: '',
    products: [],
    selectedProduct: null
  });

  const openThumbnailSelector = useCallback((productName: string, products: Product[], selectedProduct: Product) => {
    setThumbnailState({
      isOpen: true,
      productName,
      products,
      selectedProduct
    });
  }, []);

  const closeThumbnailSelector = useCallback(() => {
    setThumbnailState({
      isOpen: false,
      productName: '',
      products: [],
      selectedProduct: null
    });
  }, []);

  return {
    thumbnailState,
    openThumbnailSelector,
    closeThumbnailSelector
  };
};
