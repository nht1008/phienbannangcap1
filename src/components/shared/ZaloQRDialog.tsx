"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ZaloQRDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl?: string;
  zaloName?: string;
  zaloPhone?: string;
}

export const ZaloQRDialog = ({ 
  isOpen, 
  onClose, 
  qrCodeUrl,
  zaloName = "Nguyễn Thị Nguyệt",
  zaloPhone = "0976778612"
}: ZaloQRDialogProps) => {
  if (!isOpen) return null;

  // Use portal to render at document.body level
  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-md relative" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Image 
              src="/icons/icon zalo.webp" 
              alt="Zalo" 
              width={32} 
              height={32} 
              className="w-8 h-8"
            />
            <h2 className="text-xl font-bold text-gray-800">Kết nối Zalo</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Quét mã QR để kết nối
            </h3>
            <p className="text-gray-600 text-sm">
              Sử dụng ứng dụng Zalo để quét mã QR này và bắt đầu trò chuyện với chúng tôi
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            {qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="Zalo QR Code"
                width={200}
                height={200}
                className="mx-auto rounded-lg"
                onError={(e) => {
                  // Fallback to generated QR if custom QR fails
                  (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/${zaloPhone.replace(/[^0-9]/g, '')}`;
                }}
              />
            ) : (
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://zalo.me/${zaloPhone.replace(/[^0-9]/g, '')}`}
                alt="Zalo QR Code"
                width={200}
                height={200}
                className="mx-auto rounded-lg"
              />
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Hoặc tìm kiếm trực tiếp:</p>
            <p className="font-semibold text-blue-600">{zaloName}</p>
            <p className="text-sm text-gray-600">{zaloPhone}</p>
          </div>

          {/* Instructions */}
          <div className="text-left bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Hướng dẫn:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Mở ứng dụng Zalo trên điện thoại</li>
              <li>2. Nhấn vào biểu tượng quét QR</li>
              <li>3. Quét mã QR phía trên</li>
              <li>4. Bắt đầu trò chuyện với chúng tôi!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
