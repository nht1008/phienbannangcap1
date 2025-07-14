import { useState } from 'react';
import { useToast } from './use-toast';

interface UploadResult {
  url: string;
  publicId: string;
}

interface UseCloudinaryUploadReturn {
  uploadImage: (file: File, folder?: string) => Promise<UploadResult | null>;
  deleteImage: (publicId: string) => Promise<boolean>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadImage = async (file: File, folder: string = 'fleur-manager'): Promise<UploadResult | null> => {
    if (!file) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file để tải lên",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "File phải là định dạng ảnh",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "File quá lớn. Kích thước tối đa là 10MB",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: "Thành công",
        description: "Tải ảnh lên thành công",
      });

      return {
        url: result.url,
        publicId: result.publicId,
      };

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tải ảnh lên. Vui lòng thử lại",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async (publicId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cloudinary-upload?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa ảnh thành công",
        });
        return true;
      } else {
        throw new Error(result.error || 'Delete failed');
      }

    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa ảnh. Vui lòng thử lại",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    uploadProgress,
  };
}
