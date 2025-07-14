import React, { useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import Image from 'next/image';

interface ImageUploadProps {
  onImageUploaded: (url: string, publicId: string) => void;
  onImageRemoved?: (publicId: string) => void;
  folder?: string;
  maxImages?: number;
  currentImages?: Array<{ url: string; publicId?: string }>;
  className?: string;
}

export function ImageUpload({
  onImageUploaded,
  onImageRemoved,
  folder = 'fleur-manager',
  maxImages = 5,
  currentImages = [],
  className = '',
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, isUploading, uploadProgress } = useCloudinaryUpload();

  const handleFiles = async (files: FileList) => {
    const remainingSlots = maxImages - currentImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const result = await uploadImage(file, folder);
      if (result) {
        onImageUploaded(result.url, result.publicId);
      }
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async (index: number) => {
    const image = currentImages[index];
    if (image.publicId && onImageRemoved) {
      const success = await deleteImage(image.publicId);
      if (success) {
        onImageRemoved(image.publicId);
      }
    }
  };

  const canUploadMore = currentImages.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
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
          onClick={handleButtonClick}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              multiple
              className="hidden"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div className="space-y-4 w-full max-w-xs">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Đang tải ảnh lên...</p>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tải ảnh lên</h3>
                <p className="text-muted-foreground mb-4">
                  Kéo thả ảnh vào đây hoặc click để chọn file
                </p>
                <Button type="button" variant="secondary">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Chọn ảnh
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Tối đa {maxImages} ảnh, định dạng JPG, PNG, WEBP
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tiến trình tải lên</span>
            <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Ảnh đã tải lên ({currentImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentImages.map((image, index) => (
              <div key={index} className="relative group">
                <Card className="overflow-hidden">
                  <div className="aspect-square relative">
                    <Image
                      src={image.url}
                      alt={`Uploaded image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                    {onImageRemoved && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
