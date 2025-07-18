"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeStringForSearch, formatCompactCurrency } from '@/lib/utils';
import type { Product, ShopInfo } from '@/types';
import { Crown, ShoppingCart, Eye, LogIn, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue } from "firebase/database";
import { getProductThumbnail } from '@/lib/product-thumbnail-utils';
import AuthDialogs from '@/components/auth/AuthDialogs';

interface PreAuthStorefrontProps {
  shopInfo?: ShopInfo | null;
  storeLogo?: string;
}

const PreAuthProductCard = ({
  product,
  productGroup,
  isTopSeller,
  getProductThumbnail,
  isPriority = false,
}: {
  product: Product;
  productGroup: Product[];
  isTopSeller: boolean;
  getProductThumbnail: (product: Product) => string;
  isPriority?: boolean;
}) => {
  // Calculate price range for products with multiple variants
  const getPriceDisplay = () => {
    if (productGroup.length === 1) {
      return formatCompactCurrency(product.price);
    } else {
      const prices = productGroup.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return formatCompactCurrency(minPrice);
      } else {
        return `${formatCompactCurrency(minPrice)} - ${formatCompactCurrency(maxPrice)}`;
      }
    }
  };

  // Check if any variant is in stock
  const hasStock = productGroup.some(p => p.quantity > 0);

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <div className="aspect-square w-full overflow-hidden relative">
          {/* Stock status badge in top-right corner of image */}
          <div className="absolute top-2 right-2 z-20">
            <div className={`text-xs font-bold px-2 py-1 rounded-full shadow-md ${
              hasStock 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {hasStock ? '● Còn hàng' : '○ Hết hàng'}
            </div>
          </div>
          
          <Image
            src={getProductThumbnail(product)}
            alt={product.name}
            fill
            priority={isPriority}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 p-4 flex flex-col">
            <div className="flex-grow">
              <div className="flex flex-col gap-1 items-start">
                {isTopSeller && (
                  <div className="flex items-center bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    <Crown className="h-3 w-3 mr-1" />
                    Bán chạy
                  </div>
                )}
              </div>
            </div>
            <div className="text-white">
              <CardTitle className="text-lg font-bold whitespace-normal break-words" title={product.name}>
                {product.name}
              </CardTitle>
              <p className="text-base font-semibold text-amber-300">
                {getPriceDisplay()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default function PreAuthStorefront({ shopInfo, storeLogo }: PreAuthStorefrontProps) {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [storefrontProductIds, setStorefrontProductIds] = useState<Record<string, boolean>>({});
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  // Load data from Firebase
  useEffect(() => {
    setIsLoading(true);
    
    // Load inventory
    const inventoryRef = ref(db, 'inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const inventoryData = snapshot.val();
        const products = Object.keys(inventoryData).map(key => ({
          id: key,
          ...inventoryData[key]
        }));
        setInventory(products);
      }
    });

    // Load storefront configuration
    const storefrontRef = ref(db, 'storefront');
    const unsubscribeStorefront = onValue(storefrontRef, (snapshot) => {
      if (snapshot.exists()) {
        setStorefrontProductIds(snapshot.val());
      }
    });

    // Load invoices for sales statistics
    const invoicesRef = ref(db, 'invoices');
    const unsubscribeInvoices = onValue(invoicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const invoicesData = snapshot.val();
        const invoicesList = Object.keys(invoicesData).map(key => ({
          id: key,
          ...invoicesData[key]
        }));
        setInvoices(invoicesList);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribeInventory();
      unsubscribeStorefront();
      unsubscribeInvoices();
    };
  }, []);

  // Calculate product sales
  const productSales = React.useMemo(() => {
    const salesMap: Record<string, number> = {};
    invoices.forEach(invoice => {
      invoice.items?.forEach((item: any) => {
        salesMap[item.id] = (salesMap[item.id] || 0) + item.quantityInCart;
      });
    });
    return salesMap;
  }, [invoices]);

  const topSellingProductIds = React.useMemo(() => {
    return Object.entries(productSales)
      .sort(([, salesA], [, salesB]) => salesB - salesA)
      .slice(0, 10)
      .map(([productId]) => productId);
  }, [productSales]);

  // Filter storefront products
  const storefrontProducts = React.useMemo(() => {
    return inventory.filter(product => storefrontProductIds[product.id]);
  }, [inventory, storefrontProductIds]);

  // Group products by name
  const groupedProductsByName = React.useMemo(() => {
    const groups: Record<string, Product[]> = {};
    storefrontProducts.forEach(p => {
      if (!groups[p.name]) {
        groups[p.name] = [];
      }
      groups[p.name].push(p);
    });
    return Object.values(groups);
  }, [storefrontProducts]);

  // Sort by sales
  const sortedProductGroups = React.useMemo(() => {
    return [...groupedProductsByName].sort((groupA, groupB) => {
      const salesA = groupA.reduce((sum, p) => sum + (productSales[p.id] || 0), 0);
      const salesB = groupB.reduce((sum, p) => sum + (productSales[p.id] || 0), 0);
      return salesB - salesA;
    });
  }, [groupedProductsByName, productSales]);

  const getProductThumbnailWrapper = React.useCallback((product: Product) => {
    return getProductThumbnail(product, inventory);
  }, [inventory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header với logo và nút đăng nhập */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo cửa hàng - tăng kích thước */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center">
                {storeLogo ? (
                  <Image 
                    src={storeLogo} 
                    alt={shopInfo?.name ? `Logo ${shopInfo.name}` : "Logo Cửa Hàng"} 
                    width={80} 
                    height={80} 
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-3xl">🌸</div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {shopInfo?.name || "Cửa Hàng Hoa Công Nguyệt"}
                </h1>
                <p className="text-sm text-white/80">Hoa Tươi Mỗi Ngày - Hạnh Phúc Đong Đầy</p>
              </div>
            </div>
            
            {/* Nút đăng nhập và đăng ký bây giờ sẽ được xử lý bởi sticky buttons */}
          </div>
        </div>
      </div>

      {/* Nút đăng nhập và đăng ký sticky */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        <Button 
          className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
          onClick={() => setIsRegisterDialogOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Đăng ký
        </Button>
        <Button 
          className="bg-red-500 text-white hover:bg-red-600 shadow-lg"
          onClick={() => setIsLoginDialogOpen(true)}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Đăng nhập
        </Button>
      </div>

      {/* Thông tin cửa hàng */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-gray-700">
                <strong>Địa chỉ:</strong> {shopInfo?.address || "Chợ Hoa-Mê Linh-Hà Nội"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">📞</span>
              <span className="text-gray-700">
                <strong>Hotline:</strong> {shopInfo?.phone || "0976778612"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Khám phá bộ sưu tập hoa tươi đẹp nhất!</h2>
          <p className="text-lg mb-6 text-white/90">
            Đăng nhập ngay để đặt hàng và tận hưởng những ưu đãi đặc biệt
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="outline" 
              className="text-red-500 border-white bg-white hover:bg-gray-100"
              onClick={() => setIsRegisterDialogOpen(true)}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Đăng ký miễn phí
            </Button>
            <Button 
              size="lg" 
              className="bg-yellow-500 text-black hover:bg-yellow-400 shadow-xl"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Đặt hàng ngay
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Showcase - Hình ảnh kích thích mua hàng */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Sản phẩm nổi bật</h3>
            <p className="text-gray-600 text-lg">Những mẫu hoa tươi độc đáo, tinh tế cho mọi dịp đặc biệt</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {/* Showcase Gallery - Hiển thị tất cả 16 ảnh */}
            {[
              { src: "/showcase/flower1.webp.webp", alt: "Hoa cưới đẹp", available: true },
              { src: "/showcase/flower2.webp.webp", alt: "Hoa sinh nhật", available: true },
              { src: "/showcase/flower3.webp.webp", alt: "Hoa valentine", available: true },
              { src: "/showcase/flower4.webp.webp", alt: "Hoa khai trương", available: true },
              { src: "/showcase/flower5.webp.webp", alt: "Hoa chia buồn", available: true },
              { src: "/showcase/flower6.webp.webp", alt: "Hoa tặng mẹ", available: true },
              { src: "/showcase/flower7.webp.webp", alt: "Hoa trang trí", available: true },
              { src: "/showcase/flower8.webp.webp", alt: "Hoa chúc mừng", available: true },
              { src: "/showcase/flower9.webp.webp", alt: "Hoa kỷ niệm", available: true },
              { src: "/showcase/flower10.webp.webp", alt: "Hoa tốt nghiệp", available: true },
              { src: "/showcase/flower11.webp.webp", alt: "Hoa chúc sức khỏe", available: true },
              { src: "/showcase/flower12.webp.webp", alt: "Hoa tươi hàng ngày", available: true },
              { src: "/showcase/flower13.webp.webp", alt: "Hoa trang trí văn phòng", available: true },
              { src: "/showcase/flower14.webp.webp", alt: "Hoa lãng mạn", available: true },
              { src: "/showcase/flower15.webp.webp", alt: "Hoa thỏa lòng người mẹ", available: true },
              { src: "/showcase/flower16.webp.webp", alt: "Hoa đặc biệt", available: true }
            ].filter(item => item.available !== false).map((item, index) => (
              <div 
                key={index} 
                className="relative group overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => setIsLoginDialogOpen(true)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/E5E7EB/9CA3AF?text=No+Image'; 
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="font-semibold text-sm">{item.alt}</p>
                    <p className="text-xs text-white/80">Nhấn để đặt hàng</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-xl px-8 py-3"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <Eye className="mr-2 h-5 w-5" />
              Xem Tất Cả Sản Phẩm
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl shadow-2xl relative overflow-hidden mt-12">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative z-10 px-6">
          <h1 className="text-4xl font-bold text-white mb-6 text-center drop-shadow-lg">
            {shopInfo?.name || "Cửa Hàng Hoa Công Nguyệt"}
          </h1>
          
          {/* Store Info, Social Media and Logo in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-start">
            {/* Column 1 - Address and Hotline */}
            <div className="text-left">
              <div className="text-white/90 space-y-2">
                <p className="text-lg font-medium drop-shadow-md">
                  📍 Địa chỉ: {shopInfo?.address || "Chợ Hoa-Mê Linh-Hà Nội"}
                </p>
                <p className="text-lg font-medium drop-shadow-md">
                  📞 Hotline: {shopInfo?.phone || "0976778612"}
                </p>
              </div>
            </div>
            
            {/* Column 2 - Social Media */}
            <div className="text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-white/90 text-lg font-medium">
                  🔗 Kết nối
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <a 
                    href="https://www.facebook.com/nguyet.nguyen.118646" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center" 
                    title="Trang Facebook của chúng tôi"
                  >
                    <Image 
                      src="/icons/icon facebook.png" 
                      alt="Facebook" 
                      width={24} 
                      height={24} 
                      className="w-6 h-6"
                    />
                  </a>
                  <a
                    href="https://zalo.me/0976778612"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 backdrop-blur-sm p-3 rounded-full text-white font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center" 
                    title="Kết nối Zalo"
                  >
                    <Image 
                      src="/icons/icon zalo.webp" 
                      alt="Zalo" 
                      width={24} 
                      height={24} 
                      className="w-6 h-6"
                    />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Column 3 - Logo */}
            <div className="text-right">
              <div className="flex justify-end">
                {/* Logo cửa hàng */}
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                  <Image 
                    src={storeLogo || "https://via.placeholder.com/96x96/FF69B4/FFFFFF?text=LOGO"} 
                    alt={shopInfo?.name ? `Logo ${shopInfo.name}` : "Logo Cửa Hàng"} 
                    width={96} 
                    height={96} 
                    className="rounded-full object-cover w-full h-full"
                    onError={(e) => {
                      // Fallback về logo mặc định nếu không tải được hình tùy chỉnh
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDgiIGN5PSI0OCIgcj0iNDgiIGZpbGw9IiNGRkY1RjUiLz4KPHN2ZyB4PSIyNCIgeT0iMjQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkY2Qzk0Ii8+CjwvcGF0aD4KPHRleHQgeD0iNDgiIHk9IjU2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0iVmVyZGFuYSI+TG9nbzwvdGV4dD4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="text-center border-t border-white/20 pt-4">
            <p className="text-white/80 text-sm">
              © 2025 Cửa Hàng Hoa Công Nguyệt
            </p>
          </div>
        </div>
      </div>

      {/* Auth Dialogs */}
      <AuthDialogs
        shopInfo={shopInfo}
        isLoginOpen={isLoginDialogOpen}
        isRegisterOpen={isRegisterDialogOpen}
        onLoginClose={() => setIsLoginDialogOpen(false)}
        onRegisterClose={() => setIsRegisterDialogOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginDialogOpen(false);
          setIsRegisterDialogOpen(true);
        }}
        onSwitchToLogin={() => {
          setIsRegisterDialogOpen(false);
          setIsLoginDialogOpen(true);
        }}
        isLoadingShopInfo={false}
      />
    </div>
  );
}
