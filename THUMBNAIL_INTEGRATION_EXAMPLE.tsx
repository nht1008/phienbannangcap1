// Example: How to integrate thumbnail feature in main app component

import React, { useState, useCallback } from 'react';
import { SalesTab } from '@/components/tabs/SalesTab';
import StorefrontTab from '@/components/tabs/StorefrontTab';
import type { Product } from '@/types';

export default function MainApp() {
  const [inventory, setInventory] = useState<Product[]>([]);
  
  // Handler để cập nhật thumbnail
  const handleUpdateThumbnail = useCallback(async (productId: string, thumbnailImage: string) => {
    try {
      // 1. Gọi API để cập nhật database
      const response = await fetch('/api/products/update-thumbnail', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          thumbnailImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update thumbnail');
      }

      // 2. Cập nhật local state
      setInventory(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, thumbnailImage }
          : product
      ));

      console.log(`Thumbnail updated for product ${productId}`);
    } catch (error) {
      console.error('Error updating thumbnail:', error);
      throw error; // Re-throw để component có thể show error message
    }
  }, []);

  return (
    <div className="app">
      <SalesTab
        inventory={inventory}
        // ... other props
        onUpdateThumbnail={handleUpdateThumbnail}
      />
      
      <StorefrontTab
        inventory={inventory}
        // ... other props
        onUpdateThumbnail={handleUpdateThumbnail}
      />
    </div>
  );
}

// Example API endpoint: /api/products/update-thumbnail.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function PATCH(request: NextRequest) {
  try {
    const { productId, thumbnailImage } = await request.json();

    if (!productId || !thumbnailImage) {
      return NextResponse.json(
        { error: 'Product ID and thumbnail image are required' },
        { status: 400 }
      );
    }

    // Cập nhật Firestore
    await db.collection('products').doc(productId).update({
      thumbnailImage: thumbnailImage,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Thumbnail updated successfully' 
    });
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example: Tạo utility function để get thumbnail
export const getProductThumbnail = (product: Product): string => {
  // Ưu tiên thumbnail đã được set
  if (product.thumbnailImage) {
    return product.thumbnailImage;
  }
  
  // Fallback to first image
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  
  // Final fallback
  return 'https://placehold.co/400x400.png';
};

// Example: Component để preview thumbnail trong admin panel
export const ThumbnailPreview: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="thumbnail-preview">
      <img 
        src={getProductThumbnail(product)}
        alt={`${product.name} thumbnail`}
        className="w-16 h-16 object-cover rounded-md border"
      />
      <div className="text-sm">
        <p className="font-medium">{product.name}</p>
        <p className="text-muted-foreground">
          {product.thumbnailImage ? 'Custom thumbnail' : 'Default (first image)'}
        </p>
      </div>
    </div>
  );
};
