
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ShopInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { UploadCloud, Save } from 'lucide-react'; // Added Save icon
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export type OverallFontSize = 'sm' | 'md' | 'lg';
export type NumericDisplaySize = 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl';

const defaultShopInfo: ShopInfo = {
  name: '',
  address: '',
  phone: '',
  logoUrl: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankName: '',
  showShopLogoOnInvoice: true,
  showShopAddressOnInvoice: true,
  showShopPhoneOnInvoice: true,
  showShopBankDetailsOnInvoice: true,
  showEmployeeNameOnInvoice: true,
  invoiceThankYouMessage: "Cảm ơn quý khách đã mua hàng!",
};

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  overallFontSize?: OverallFontSize;
  onOverallFontSizeChange?: (size: OverallFontSize) => void;
  numericDisplaySize?: NumericDisplaySize;
  onNumericDisplaySizeChange?: (size: NumericDisplaySize) => void;
  shopInfo: ShopInfo | null;
  onSaveShopInfo: (newInfo: ShopInfo) => Promise<void>;
  hasAdminOrManagerRights: boolean;
  isLoadingShopInfo: boolean;
}

const MAX_LOGO_SIZE_MB = 3; // Updated
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

export function SettingsDialog({
  isOpen,
  onClose,
  overallFontSize,
  onOverallFontSizeChange,
  numericDisplaySize,
  onNumericDisplaySizeChange,
  shopInfo,
  onSaveShopInfo,
  hasAdminOrManagerRights,
  isLoadingShopInfo
}: SettingsDialogProps) {
  const [editableShopInfo, setEditableShopInfo] = useState<ShopInfo>(shopInfo || defaultShopInfo);
  const [isSavingShopInfo, setIsSavingShopInfo] = useState(false);
  const { toast } = useToast();
  const { uploadImage, isUploading: isUploadingLogo } = useCloudinaryUpload();

  useEffect(() => {
    setEditableShopInfo(shopInfo || defaultShopInfo);
  }, [shopInfo]);

  const handleShopInfoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableShopInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        toast({
          title: "Lỗi tải ảnh",
          description: `Kích thước file không được vượt quá ${MAX_LOGO_SIZE_MB}MB.`,
          variant: "destructive",
        });
        e.target.value = ""; // Clear the input
        return;
      }

      try {
        const uploadResult = await uploadImage(file, 'shop-logos');
        if (uploadResult) {
          setEditableShopInfo(prev => ({ ...prev, logoUrl: uploadResult.url }));
          toast({
            title: "Thành công",
            description: "Logo đã được tải lên thành công",
          });
        }
      } catch (error) {
        toast({
          title: "Lỗi tải ảnh",
          description: "Không thể tải logo lên. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
      e.target.value = ""; // Clear the input
    }
  };

  const handleSaveShopInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminOrManagerRights) {
      toast({ title: "Lỗi", description: "Bạn không có quyền thực hiện hành động này.", variant: "destructive" });
      return;
    }
    setIsSavingShopInfo(true);
    try {
      await onSaveShopInfo(editableShopInfo);
      onClose(); // Close the dialog on successful save
    } catch (error) {
      // Error toast is handled by page.tsx
    } finally {
      setIsSavingShopInfo(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cài đặt</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {hasAdminOrManagerRights && (
            <>
              <section>
                <h3 className="text-lg font-semibold mb-3 text-primary">Thông tin cửa hàng (Quản trị viên/Quản lý)</h3>
                {isLoadingShopInfo ? (
                  <div className="flex items-center text-muted-foreground">
                    <LoadingSpinner size={20} className="mr-2" />
                    Đang tải thông tin cửa hàng...
                  </div>
                ) : (
                <form onSubmit={handleSaveShopInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shopName">Tên cửa hàng</Label>
                      <Input id="shopName" name="name" value={editableShopInfo.name} onChange={handleShopInfoInputChange} placeholder="VD: Cửa Hàng Hoa Tươi ABC" />
                    </div>
                    <div>
                      <Label htmlFor="shopPhone">Số điện thoại cửa hàng</Label>
                      <Input id="shopPhone" name="phone" value={editableShopInfo.phone} onChange={handleShopInfoInputChange} placeholder="VD: 0123 456 789" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shopAddress">Địa chỉ cửa hàng</Label>
                    <Input id="shopAddress" name="address" value={editableShopInfo.address} onChange={handleShopInfoInputChange} placeholder="VD: 123 Đường Hoa, Phường X, Quận Y, TP. Z" />
                  </div>

                  <div>
                    <Label htmlFor="shopLogoFile" className="mb-1 block">Logo cửa hàng (Tối đa ${MAX_LOGO_SIZE_MB}MB)</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            id="shopLogoFile"
                            name="logoUrl"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileChange}
                            disabled={isUploadingLogo}
                            className="bg-card flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {isUploadingLogo ? (
                            <div className="w-[60px] h-[60px] flex items-center justify-center rounded-md border bg-muted/50">
                                <LoadingSpinner size={24} />
                            </div>
                        ) : editableShopInfo.logoUrl ? (
                            <Image
                                src={editableShopInfo.logoUrl}
                                alt="Xem trước logo"
                                width={60}
                                height={60}
                                className="rounded-md object-contain border aspect-square bg-muted/50"
                                data-ai-hint="shop logo"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                             <div className="w-[60px] h-[60px] flex items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                        )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" disabled={isSavingShopInfo || isUploadingLogo}>
                    {isSavingShopInfo || isUploadingLogo ? (
                        <>
                            <LoadingSpinner size={20} className="mr-2 text-white" />
                            {isUploadingLogo ? 'Đang tải logo...' : 'Đang lưu...'}
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Lưu thông tin cửa hàng
                        </>
                    )}
                  </Button>
                </form>
                )}
              </section>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
