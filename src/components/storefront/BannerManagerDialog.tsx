import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Banner } from '@/types';
import { Upload, Trash2, GripVertical, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Reorder } from "framer-motion";

interface BannerManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  banners: Banner[];
  onBannersChange: (banners: Banner[]) => void;
}

export function BannerManagerDialog({ isOpen, onClose, banners, onBannersChange }: BannerManagerDialogProps) {
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE_MB = 4;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  React.useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "Lỗi: Tệp quá lớn",
          description: `Vui lòng chọn một hình ảnh nhỏ hơn ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/cloudinary-banners', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const result = await response.json();
        if (result.success && result.banner) {
            console.log('[BannerManagerDialog] Upload successful, new banner:', result.banner);
            const updatedBanners = [...localBanners, result.banner];
            setLocalBanners(updatedBanners);
            onBannersChange(updatedBanners);
            toast({ title: "Success", description: result.message || "Banner uploaded." });
        } else {
            console.error('[BannerManagerDialog] Upload failed, server response:', result);
            throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/cloudinary-banners?id=${bannerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Delete failed');

      const updatedBanners = localBanners.filter(b => b.id !== bannerId);
      setLocalBanners(updatedBanners);
      onBannersChange(updatedBanners);
      
      toast({ title: "Success", description: "Banner deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete banner.", variant: "destructive" });
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    const orderedBanners = localBanners.map((banner, index) => ({ ...banner, order: index }));
    try {
      const response = await fetch('/api/cloudinary-banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUpdates: orderedBanners.map((banner, index) => ({ id: banner.id, order: index })) }),
      });

      if (!response.ok) throw new Error('Save order failed');
      
      onBannersChange(orderedBanners);
      toast({ title: "Success", description: "Banner order saved." });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save banner order.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Banners</DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <Reorder.Group axis="y" values={localBanners} onReorder={setLocalBanners}>
            {localBanners.map((banner) => (
              <Reorder.Item key={banner.id} value={banner}>
                <div className="flex items-center gap-4 p-2 mb-2 bg-muted rounded-lg">
                  <GripVertical className="cursor-grab" />
                  <div className="w-80 aspect-[5/3] rounded overflow-hidden">
                    <Image src={banner.url} alt="Banner preview" width={320} height={192} className="w-full h-full object-cover" />
                  </div>
                  <p className="flex-grow text-sm truncate">{banner.id.split('/').pop()}</p>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
        <DialogFooter className="sm:justify-between items-center">
           <div className="flex flex-col items-start">
             <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                 {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                 Tải ảnh mới
             </Button>
             <p className="text-xs text-muted-foreground mt-1">Tối đa {MAX_FILE_SIZE_MB}MB mỗi ảnh.</p>
           </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div>
                <Button variant="ghost" onClick={onClose}>Hủy</Button>
                <Button onClick={handleSaveOrder} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save and Close
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}