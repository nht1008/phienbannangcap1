"use client";

import React from 'react';
import { ProductFormDialog } from './ProductFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent } from "@/components/ui/alert-dialog";
import type { Product, ProductOptionType } from '@/types';

interface ProductDialogsProps {
  isProductFormOpen: boolean;
  handleCloseProductFormDialog: () => void;
  handleProductFormSubmit: (productData: Omit<Product, 'id'>, isEdit: boolean, productId?: string) => Promise<boolean>;
  currentEditingProduct: Product | null;
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  isProductFormEditMode: boolean;
  defaultProductFormData: any; // Consider using a more specific type
  isConfirmingProductDelete: boolean;
  setIsConfirmingProductDelete: (isOpen: boolean) => void;
  confirmDeleteProduct: () => void;
  inventory?: Product[]; // Danh sách sản phẩm có sẵn
}

export const ProductDialogs: React.FC<ProductDialogsProps> = ({
  isProductFormOpen,
  handleCloseProductFormDialog,
  handleProductFormSubmit,
  currentEditingProduct,
  productNameOptions,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  isProductFormEditMode,
  defaultProductFormData,
  isConfirmingProductDelete,
  setIsConfirmingProductDelete,
  confirmDeleteProduct,
  inventory,
}) => {
  return (
    <>
      <ProductFormDialog
        isOpen={isProductFormOpen}
        onClose={handleCloseProductFormDialog}
        onSubmit={handleProductFormSubmit}
        initialData={currentEditingProduct}
        productNameOptions={productNameOptions}
        colorOptions={colorOptions}
        productQualityOptions={productQualityOptions}
        sizeOptions={sizeOptions}
        unitOptions={unitOptions}
        isEditMode={isProductFormEditMode}
        defaultFormState={defaultProductFormData}
        inventory={inventory}
      />

      {isConfirmingProductDelete && (
        <AlertDialog open={isConfirmingProductDelete} onOpenChange={setIsConfirmingProductDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitleComponent>Xác nhận xóa sản phẩm?</AlertDialogTitleComponent>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmingProductDelete(false)}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProduct} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};