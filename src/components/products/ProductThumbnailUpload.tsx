"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Product } from '@/types';

interface ProductThumbnailUploadProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onThumbnailUpdate: (productId: string, thumbnailUrl: string) => void;
}

export function ProductThumbnailUpload({
  isOpen,
  onClose,
  product,
  onThumbnailUpdate
}: ProductThumbnailUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { uploadImage, isUploading, uploadProgress } = useCloudinaryUpload();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file ảnh",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Upload ảnh lên Cloudinary
      const uploadResult = await uploadImage(file, 'product-thumbnails');
      if (!uploadResult) {
        throw new Error('Upload failed');
      }

      // Cập nhật database trực tiếp thông qua callback
      await onThumbnailUpdate(product.id, uploadResult.url);

      // Thông báo thành công và cập nhật UI
      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh đại diện sản phẩm",
      });
      onClose();

    } catch (error) {
      console.error('Error updating thumbnail:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const removeThumbnail = async () => {
    try {
      setIsUpdating(true);

      // Xóa thumbnail trực tiếp thông qua callback
      await onThumbnailUpdate(product.id, '');
      
      toast({
        title: "Thành công",
        description: "Đã xóa ảnh đại diện sản phẩm",
      });
      onClose();

    } catch (error) {
      console.error('Error removing thumbnail:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa ảnh đại diện",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isProcessing = isUploading || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cập nhật ảnh đại diện</DialogTitle>
          <DialogDescription>
            Thêm hoặc thay đổi ảnh đại diện cho sản phẩm "{product.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hiển thị ảnh đại diện hiện tại */}
          {product.thumbnailImage && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ảnh đại diện hiện tại:</p>
              <div className="relative">
                <Image
                  src={product.thumbnailImage}
                  alt={`${product.name} thumbnail`}
                  width={200}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeThumbnail}
                  disabled={isProcessing}
                  title="Xóa ảnh đại diện"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Upload area */}
          <Card 
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('thumbnail-file-input')?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <input
                id="thumbnail-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              
              {isProcessing ? (
                <div className="space-y-4 w-full max-w-xs">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "Đang tải ảnh lên..." : "Đang cập nhật..."}
                    </p>
                    {isUploading && <Progress value={uploadProgress} className="w-full" />}
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {product.thumbnailImage ? "Thay đổi ảnh đại diện" : "Tải ảnh đại diện"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Kéo thả ảnh vào đây hoặc click để chọn file
                  </p>
                  <Button type="button" variant="secondary">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Chọn ảnh
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Định dạng JPG, PNG, WEBP
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
