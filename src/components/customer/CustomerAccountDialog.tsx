"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User, Camera, Lock, Upload, X, Loader2, Eye, EyeOff } from 'lucide-react';
import type { Customer } from '@/types';

interface CustomerAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserPhotoURL?: string;
  onProfileUpdate?: (name: string, photoURL: string) => void;
}

export function CustomerAccountDialog({
  isOpen,
  onOpenChange,
  customer,
  currentUserEmail,
  currentUserName,
  currentUserPhotoURL,
  onProfileUpdate,
}: CustomerAccountDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile states
  const [displayName, setDisplayName] = useState(currentUserName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Avatar states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useCloudinaryUpload();
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

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
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelect(e.target.files[0]);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedImage) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ảnh để tải lên",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingProfile(true);
      
      // Upload to Cloudinary
      const result = await uploadImage(selectedImage, 'customer-avatars');
      if (!result) {
        throw new Error('Failed to upload image');
      }

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: result.url,
        });
      }

      // Call parent callback if provided
      if (onProfileUpdate) {
        onProfileUpdate(displayName, result.url);
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh đại diện",
      });

      // Reset states
      setSelectedImage(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải ảnh lên. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên hiển thị",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingProfile(true);
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        });
      }

      if (onProfileUpdate) {
        onProfileUpdate(displayName.trim(), currentUserPhotoURL || '');
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật tên hiển thị",
      });
      
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tên hiển thị. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      
      if (auth.currentUser && currentUserEmail) {
        // Thực hiện re-authentication trước khi đổi mật khẩu
        const credential = EmailAuthProvider.credential(currentUserEmail, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Sau khi re-authenticate thành công, đổi mật khẩu
        await updatePassword(auth.currentUser, newPassword);
      }

      toast({
        title: "Thành công",
        description: "Đã đổi mật khẩu thành công",
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = "Không thể đổi mật khẩu. Vui lòng thử lại.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại và thử lại.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.";
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentAvatar = previewUrl || currentUserPhotoURL;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl justify-center sm:justify-start">
            <User className="h-5 w-5 sm:h-6 sm:w-6" />
            Thông tin tài khoản
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-center sm:text-left">
            Quản lý thông tin cá nhân, ảnh đại diện và bảo mật tài khoản của bạn
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
            <TabsTrigger 
              value="profile" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Thông tin cá nhân</span>
            </TabsTrigger>
            <TabsTrigger 
              value="avatar" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Ảnh đại diện</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Bảo mật</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                    <AvatarImage src={currentAvatar} alt="Avatar" />
                    <AvatarFallback>
                      {(currentUserName || customer?.name || 'KH').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="font-medium text-base sm:text-lg">{customer?.name || 'Chưa có tên'}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground break-all">{currentUserEmail}</p>
                    {customer?.tier && (
                      <Badge variant="secondary" className="text-xs">
                        Hạng {customer.tier}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Số điện thoại</Label>
                    <p className="text-xs sm:text-sm mt-1 p-2 sm:p-3 bg-muted rounded-md">
                      {customer?.phone || 'Chưa có thông tin'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Tên Zalo</Label>
                    <p className="text-xs sm:text-sm mt-1 p-2 sm:p-3 bg-muted rounded-md">
                      {customer?.zaloName || 'Chưa có thông tin'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Địa chỉ</Label>
                    <p className="text-xs sm:text-sm mt-1 p-2 sm:p-3 bg-muted rounded-md">
                      {customer?.address || 'Chưa có thông tin'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="displayName" className="text-xs sm:text-sm">Tên hiển thị</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên hiển thị"
                      className="text-sm"
                    />
                    <Button 
                      onClick={handleUpdateDisplayName}
                      disabled={isUpdatingProfile || !displayName.trim() || displayName === currentUserName}
                      className="text-xs sm:text-sm whitespace-nowrap"
                      size="sm"
                    >
                      {isUpdatingProfile && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />}
                      Cập nhật
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ảnh đại diện
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tải lên ảnh đại diện mới cho tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
                    <AvatarImage src={currentAvatar} alt="Current Avatar" />
                    <AvatarFallback className="text-lg sm:text-2xl">
                      {(currentUserName || customer?.name || 'KH').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Ảnh hiện tại
                    </p>
                  </div>
                </div>

                <Separator />

                <div
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="relative inline-block">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={80}
                          height={80}
                          className="w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-full object-cover"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0"
                          onClick={clearImageSelection}
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          onClick={handleUploadAvatar}
                          disabled={isUploading || isUpdatingProfile}
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                          size="sm"
                        >
                          {(isUploading || isUpdatingProfile) && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />}
                          Cập nhật ảnh đại diện
                        </Button>
                        <Button variant="outline" onClick={clearImageSelection} size="sm" className="text-xs sm:text-sm">
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium">
                          Kéo thả ảnh vào đây hoặc click để chọn
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF tối đa 5MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Chọn ảnh
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Đổi mật khẩu
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Cập nhật mật khẩu để bảo mật tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs sm:text-sm">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs sm:text-sm">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      className="text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Xác nhận mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full text-xs sm:text-sm"
                  size="sm"
                >
                  {isChangingPassword && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />}
                  Đổi mật khẩu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
