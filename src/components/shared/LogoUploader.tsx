import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoUploaderProps {
  currentLogoUrl?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
  className?: string;
}

export default function LogoUploader({ currentLogoUrl, onLogoUpdate, className = "" }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận tệp hình ảnh.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Lỗi", 
        description: "Kích thước tệp không được vượt quá 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'store-logos'); // Tạo folder riêng cho logo

      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Lỗi khi tải lên');
      }

      // Update logo URL
      onLogoUpdate(result.url);
      setPreviewUrl(null);
      
      toast({
        title: "Thành công",
        description: "Logo đã được cập nhật!",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải lên logo.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex justify-end">
        <div className="relative group">
          {/* Logo Display */}
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center">
            <Image 
              src={previewUrl || currentLogoUrl || "https://via.placeholder.com/96x96/FF69B4/FFFFFF?text=LOGO"} 
              alt="Logo Cửa Hàng Hoa Công Nguyệt" 
              width={96} 
              height={96} 
              className="rounded-full object-cover w-full h-full"
              onError={(e) => {
                // Fallback về logo mặc định
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDgiIGN5PSI0OCIgcj0iNDgiIGZpbGw9IiNGRkY1RjUiLz4KPHN2ZyB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkY2Qzk0Ii8+CjwvcGF0aD4KPHRleHQgeD0iNDgiIHk9IjU2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0iVmVyZGFuYSI+TG9nbzwvdGV4dD4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4K';
              }}
            />
          </div>

          {/* Upload Overlay - show on hover or when uploading */}
          <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity duration-200 ${
            isUploading || previewUrl ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {isUploading ? (
              <div className="text-white text-center">
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-1"></div>
                <span className="text-xs">Đang tải...</span>
              </div>
            ) : previewUrl ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={cancelPreview}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={triggerFileSelect}
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 rounded-full"
                title="Thay đổi logo"
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
