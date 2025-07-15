"use client";

import React, { useState, useMemo, useEffect, useCallback, useImperativeHandle } from 'react';
import type { Product, CartItem, Customer, Invoice } from '@/types';
import type { User } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from '@/components/ui/carousel';
import { ChevronsUpDown, Check, PlusCircle, Trash2, ShoppingCart, Minus, Plus, Tag, ChevronsLeft, ChevronsRight, ImageIcon } from 'lucide-react';
import { getProductThumbnail as getProductThumbnailUtil } from '@/lib/product-thumbnail-utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPhoneNumber, normalizeStringForSearch, getCustomerTierClass } from '@/lib/utils';
import type { NumericDisplaySize } from '@/components/settings/SettingsDialog';
import { useToast } from '@/hooks/use-toast';
import { getProductThumbnailWithSize } from '@/lib/product-thumbnail-utils';
import { ThumbnailSelector } from '@/components/shared/ThumbnailSelector';
import { useThumbnailSelector } from '@/hooks/use-thumbnail-selector';


interface SalesTabProps {
  inventory: Product[];
  customers: Customer[];
  invoices: Invoice[];
  onCreateInvoice: (
    customerName: string,
    cart: CartItem[],
    subtotalAfterItemDiscounts: number,
    paymentMethod: string,
    amountPaid: number,
    isGuestCustomer: boolean,
    employeeId: string,
    employeeName: string,
    tierDiscount: number
  ) => Promise<boolean>;
  currentUser: User | null;
  numericDisplaySize: NumericDisplaySize;
  cart: CartItem[];
  onAddToCart: (item: Product) => void;
  onUpdateCartQuantity: (itemId: string, newQuantityStr: string) => void;
  onItemDiscountChange: (itemId: string, discountNghinStr: string) => boolean;
  onClearCart: () => void;
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  onUpdateThumbnail?: (productId: string, thumbnailImage: string) => Promise<void>;
}

export interface SalesTabHandles {
  triggerPaymentDialog: () => void;
}

const paymentOptions = ['Tiền mặt', 'Chuyển khoản'];

interface VariantSelection {
  color: string;
  quality: string;
  size: string;
  unit: string;
  batchNumber?: number;
  quantity: number;
}

interface AvailableVariants {
  colors: string[];
  qualities: string[];
  sizes: string[];
  units: string[];
}

interface BatchSelection {
  isOpen: boolean;
  productName: string;
  variantDetails: Omit<VariantSelection, 'batchNumber'>;
  availableBatches: Array<{
    batchNumber: number;
    quantity: number;
    product: Product;
  }>;
}

export const SalesTab = React.forwardRef<SalesTabHandles, SalesTabProps>(({
    inventory,
    customers,
    invoices,
    onCreateInvoice,
    currentUser,
    numericDisplaySize,
    cart,
    onAddToCart,
    onUpdateCartQuantity,
    onItemDiscountChange,
    onClearCart,
    colorOptions,
    productQualityOptions,
    sizeOptions,
    unitOptions,
    onUpdateThumbnail,
}, ref) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<EnhancedCustomer | null>(null);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>(paymentOptions[0]);
  const [amountPaidStr, setAmountPaidStr] = useState('');

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const [selectedProductNameForVariants, setSelectedProductNameForVariants] = useState<string | null>(null);
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({ color: '', quality: '', size: '', unit: '', quantity: 1 });
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<AvailableVariants>({ colors: [], qualities: [], sizes: [], units: [] });
  
  // Batch selection state
  const [batchSelection, setBatchSelection] = useState<BatchSelection>({
    isOpen: false,
    productName: '',
    variantDetails: { color: '', quality: '', size: '', unit: '', quantity: 1 },
    availableBatches: []
  });
  
  // Thumbnail selector
  const { thumbnailState, openThumbnailSelector, closeThumbnailSelector } = useThumbnailSelector();
  
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const getVipTierStyling = (tier: string) => {
    switch (tier) {
      case 'Đại gia':
        return 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg border-red-300';
      case 'Phú ông':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg border-purple-300';
      case 'Thương gia':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg border-blue-300';
      case 'Chủ đồn điền':
        return 'bg-gradient-to-r from-green-500 to-lime-500 text-white shadow-lg border-green-300';
      case 'Nông dân':
        return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg border-yellow-300';
      case 'Đầy tớ':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg border-gray-300';
      case 'Vô danh':
        return 'bg-gradient-to-r from-stone-500 to-neutral-500 text-white shadow-lg border-stone-300';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const spendingMap = new Map<string, number>();
  invoices.forEach(invoice => {
    const normalizedName = normalizeStringForSearch(invoice.customerName);
    if (normalizedName && normalizedName !== 'khachle') {
      const currentSpending = spendingMap.get(normalizedName) || 0;
      // Chỉ tính số tiền đã thanh toán thực tế, không tính số tiền nợ
      const paidAmount = invoice.amountPaid || 0;
      spendingMap.set(normalizedName, currentSpending + paidAmount);
    }
  });

  const getVipTier = (totalSpent: number): string => {
      if (totalSpent >= 100000000) return 'Đại gia';
      if (totalSpent >= 70000000) return 'Phú ông';
      if (totalSpent >= 40000000) return 'Thương gia';
      if (totalSpent >= 20000000) return 'Chủ đồn điền';
      if (totalSpent >= 10000000) return 'Nông dân';
      if (totalSpent >= 5000000) return 'Đầy tớ';
      return 'Vô danh';
  }

  const enhancedCustomers = customers.map(customer => {
    const normalizedName = normalizeStringForSearch(customer.name);
    const totalSpent = spendingMap.get(normalizedName) || 0;
    return {
      ...customer,
      totalSpent,
      vipTier: getVipTier(totalSpent),
    };
  });

  const subtotalAfterItemDiscounts = useMemo(() =>
    cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantityInCart;
      const discount = item.itemDiscount || 0;
      return sum + (itemTotal - discount);
    }, 0),
    [cart]
  );

  const areAllItemDiscountsValid = useMemo(() => {
    return cart.every(item => {
      const itemOriginalTotal = item.price * item.quantityInCart;
      const discount = item.itemDiscount || 0;
      return discount >= 0 && discount <= itemOriginalTotal;
    });
  }, [cart]);


  const finalTotalAfterAllDiscounts = useMemo(() => {
      return subtotalAfterItemDiscounts < 0 ? 0 : subtotalAfterItemDiscounts;
  }, [subtotalAfterItemDiscounts]);

  const parsedAmountPaidNghin = parseFloat(amountPaidStr) || 0;
  const actualAmountPaidVND = parsedAmountPaidNghin * 1000;
  const changeVND = actualAmountPaidVND - finalTotalAfterAllDiscounts;


  const handleOpenPaymentDialog = useCallback(() => {
    if (cart.length === 0) {
        toast({ title: "Giỏ hàng trống", description: "Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.", variant: "destructive" });
        return;
    }
    if (!areAllItemDiscountsValid) {
        toast({ title: "Giảm giá không hợp lệ", description: "Vui lòng kiểm tra lại các mục giảm giá trong giỏ hàng.", variant: "destructive" });
        return;
    }

    for (const cartItem of cart) {
      const stockItem = inventory.find(i => i.id === cartItem.id);
      if (!stockItem || stockItem.quantity < cartItem.quantityInCart) {
        toast({ title: "Lỗi số lượng", description: `Không đủ số lượng cho sản phẩm "${cartItem.name}". Vui lòng kiểm tra lại giỏ hàng.`, variant: "destructive" });
        return;
      }
    }

    setSelectedCustomer(null);
    setCustomerSearchText("");
    setAmountPaidStr('');
    setCurrentPaymentMethod(paymentOptions[0]);
    setIsPaymentDialogOpen(true);
  }, [cart, areAllItemDiscountsValid, inventory, toast]);

  useImperativeHandle(ref, () => ({
    triggerPaymentDialog: handleOpenPaymentDialog,
  }));

  const handleConfirmCheckout = async () => {
    if (!currentUser) {
      toast({ title: "Lỗi người dùng", description: "Không tìm thấy thông tin người dùng. Vui lòng thử đăng nhập lại.", variant: "destructive" });
      return;
    }
    const finalCustomerName = selectedCustomer ? selectedCustomer.name : 'Khách lẻ';
    const isGuest = !selectedCustomer;

    if (actualAmountPaidVND < 0) {
        toast({ title: "Lỗi thanh toán", description: "Số tiền khách trả không thể âm.", variant: "destructive" });
        return;
    }

    if (finalTotalAfterAllDiscounts > actualAmountPaidVND) {
      if (isGuest || currentPaymentMethod === 'Chuyển khoản') {
        toast({ title: "Lỗi thanh toán", description: "Khách lẻ hoặc thanh toán Chuyển khoản không được phép nợ. Vui lòng thanh toán đủ.", variant: "destructive" });
        return;
      }
    }

    const success = await onCreateInvoice(
        finalCustomerName,
        cart,
        subtotalAfterItemDiscounts,
        currentPaymentMethod,
        actualAmountPaidVND,
        isGuest,
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Không rõ",
        0 // No tier discount from this tab
    );
    if (success) {
      setIsPaymentDialogOpen(false);
      setAmountPaidStr('');
    }
  };

  const productsGroupedByName = useMemo(() => {
    const nameMap = new Map<string, { firstVariant: Product, totalStock: number }>();
    inventory.filter(p => p.quantity > 0).forEach(product => {
      if (!nameMap.has(product.name)) {
        nameMap.set(product.name, { firstVariant: product, totalStock: 0 });
      }
      const entry = nameMap.get(product.name)!;
      entry.totalStock += product.quantity;
    });
    return Array.from(nameMap.entries()).map(([name, data]) => ({
      name,
      firstVariant: data.firstVariant,
      totalStock: data.totalStock
    }));
  }, [inventory]);

  const distinctInStockVariants = useMemo(() => {
    return inventory
      .filter(p => p.quantity > 0)
      .map(p => ({
        ...p,
        displayLabel: `${p.name} ${p.color} ${p.quality || ''} ${p.size} ${p.unit} - Tồn: ${p.quantity} - Giá: ${p.price.toLocaleString('vi-VN')}`.replace(/\s\s+/g, ' ')
      }));
  }, [inventory]);


  const openVariantSelector = useCallback((productName: string) => {
    const variantsOfProduct = inventory.filter(p => p.name === productName && p.quantity > 0);
    if (variantsOfProduct.length === 0) {
      toast({ title: "Hết hàng", description: `Sản phẩm "${productName}" hiện đã hết các biến thể còn hàng.`, variant: "destructive" });
      return;
    }

    // Nếu chỉ có một sản phẩm và không có thuộc tính nào được cấu hình, thêm trực tiếp
    if (variantsOfProduct.length === 1 && 
        colorOptions.length === 0 && 
        productQualityOptions.length === 0 && 
        sizeOptions.length === 0 && 
        unitOptions.length === 0) {
      onAddToCart(variantsOfProduct[0]);
      return;
    }

    // Lấy tất cả các thuộc tính có sẵn
    const colors = Array.from(new Set(variantsOfProduct.map(p => p.color).filter((c): c is string => Boolean(c && c.trim() !== '' && colorOptions.includes(c))))).sort();
    const qualities = Array.from(new Set(variantsOfProduct.map(p => p.quality).filter((q): q is string => Boolean(q && q.trim() !== '' && productQualityOptions.includes(q))))).sort();
    const sizes = Array.from(new Set(variantsOfProduct.map(p => p.size).filter((s): s is string => Boolean(s && s.trim() !== '' && sizeOptions.includes(s))))).sort();
    const units = Array.from(new Set(variantsOfProduct.map(p => p.unit).filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u))))).sort();
    
    setAvailableVariants({ colors, qualities, sizes, units });
    setSelectedProductNameForVariants(productName);
    setVariantSelection({ 
      color: colors[0] || '', 
      quality: qualities[0] || '', 
      size: sizes[0] || '', 
      unit: units[0] || '',
      quantity: 1
    });
    setIsVariantSelectorOpen(true);
  }, [inventory, toast, colorOptions, productQualityOptions, sizeOptions, unitOptions, onAddToCart]);

  useEffect(() => {
    if (selectedProductNameForVariants) {
      // Lấy tất cả variants của sản phẩm
      const allVariants = inventory.filter(p => p.name === selectedProductNameForVariants && p.quantity > 0);
      
      // Lọc theo màu sắc nếu đã chọn
      const filteredByColor = variantSelection.color && colorOptions.length > 0 
        ? allVariants.filter(p => p.color === variantSelection.color)
        : allVariants;
      
      // Lấy chất lượng từ variants đã lọc
      const qualities = Array.from(new Set(filteredByColor.map(p => p.quality).filter((q): q is string => Boolean(q && q.trim() !== '' && productQualityOptions.includes(q))))).sort();
      
      setAvailableVariants(prev => ({ ...prev, qualities }));
      
      // Cập nhật chất lượng được chọn
      if (productQualityOptions.length > 0 && qualities.length > 0) {
        const newQuality = qualities.includes(variantSelection.quality) ? variantSelection.quality : qualities[0];
        if (newQuality !== variantSelection.quality) {
          setVariantSelection(prev => ({ ...prev, quality: newQuality }));
        }
      }
    }
  }, [selectedProductNameForVariants, variantSelection.color, inventory, productQualityOptions]);

  useEffect(() => {
    if (selectedProductNameForVariants) {
      // Lấy tất cả variants của sản phẩm
      const allVariants = inventory.filter(p => p.name === selectedProductNameForVariants && p.quantity > 0);
      
      // Lọc theo màu sắc và chất lượng nếu đã chọn
      let filteredVariants = allVariants;
      if (variantSelection.color && colorOptions.length > 0) {
        filteredVariants = filteredVariants.filter(p => p.color === variantSelection.color);
      }
      if (variantSelection.quality && productQualityOptions.length > 0) {
        filteredVariants = filteredVariants.filter(p => p.quality === variantSelection.quality);
      }
      
      // Lấy kích thước từ variants đã lọc
      const sizes = Array.from(new Set(filteredVariants.map(p => p.size).filter((s): s is string => Boolean(s && s.trim() !== '' && sizeOptions.includes(s))))).sort();
      
      setAvailableVariants(prev => ({ ...prev, sizes }));
      
      // Cập nhật kích thước được chọn
      if (sizeOptions.length > 0 && sizes.length > 0) {
        const newSize = sizes.includes(variantSelection.size) ? variantSelection.size : sizes[0];
        if (newSize !== variantSelection.size) {
          setVariantSelection(prev => ({ ...prev, size: newSize }));
        }
      }
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.quality, inventory, sizeOptions]);

  useEffect(() => {
    if (selectedProductNameForVariants) {
      // Lấy tất cả variants của sản phẩm
      const allVariants = inventory.filter(p => p.name === selectedProductNameForVariants && p.quantity > 0);
      
      // Lọc theo tất cả các thuộc tính đã chọn
      let filteredVariants = allVariants;
      if (variantSelection.color && colorOptions.length > 0) {
        filteredVariants = filteredVariants.filter(p => p.color === variantSelection.color);
      }
      if (variantSelection.quality && productQualityOptions.length > 0) {
        filteredVariants = filteredVariants.filter(p => p.quality === variantSelection.quality);
      }
      if (variantSelection.size && sizeOptions.length > 0) {
        filteredVariants = filteredVariants.filter(p => p.size === variantSelection.size);
      }
      
      // Lấy đơn vị từ variants đã lọc
      const units = Array.from(new Set(filteredVariants.map(p => p.unit).filter((u): u is string => Boolean(u && u.trim() !== '' && unitOptions.includes(u))))).sort();
      
      setAvailableVariants(prev => ({ ...prev, units }));
      
      // Cập nhật đơn vị được chọn
      if (unitOptions.length > 0 && units.length > 0) {
        const newUnit = units.includes(variantSelection.unit) ? variantSelection.unit : units[0];
        if (newUnit !== variantSelection.unit) {
          setVariantSelection(prev => ({ ...prev, unit: newUnit }));
        }
      }
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.quality, variantSelection.size, inventory, unitOptions]);


  const handleVariantSelectionChange = (field: keyof VariantSelection, value: string) => {
    setVariantSelection(prev => {
      const newState = { ...prev, [field]: value };
      
      // LOGIC MỚI: Không reset tự động, chỉ reset khi thực sự cần thiết
      // Tìm variants có sẵn với thuộc tính mới được chọn
      const allVariants = inventory.filter(p => p.name === selectedProductNameForVariants && p.quantity > 0);
      
      if (field === 'color') {
        // Khi thay đổi màu, kiểm tra xem các thuộc tính khác có còn valid không
        const variantsWithNewColor = allVariants.filter(p => p.color === value);
        
        // Kiểm tra chất lượng hiện tại có còn valid không
        if (prev.quality && productQualityOptions.length > 0) {
          const hasValidQuality = variantsWithNewColor.some(p => p.quality === prev.quality);
          if (!hasValidQuality) {
            newState.quality = ''; // Chỉ reset khi không còn valid
          }
        }
        
        // Kiểm tra kích thước hiện tại có còn valid không
        if (prev.size && sizeOptions.length > 0) {
          const filteredByColorQuality = variantsWithNewColor.filter(p => 
            !newState.quality || p.quality === newState.quality
          );
          const hasValidSize = filteredByColorQuality.some(p => p.size === prev.size);
          if (!hasValidSize) {
            newState.size = ''; // Chỉ reset khi không còn valid
          }
        }
        
        // Kiểm tra đơn vị hiện tại có còn valid không
        if (prev.unit && unitOptions.length > 0) {
          const filteredByColorQualitySize = variantsWithNewColor.filter(p => 
            (!newState.quality || p.quality === newState.quality) &&
            (!newState.size || p.size === newState.size)
          );
          const hasValidUnit = filteredByColorQualitySize.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = ''; // Chỉ reset khi không còn valid
          }
        }
      } else if (field === 'quality') {
        // Tương tự cho chất lượng
        const variantsWithColorQuality = allVariants.filter(p => 
          p.color === prev.color && p.quality === value
        );
        
        if (prev.size && sizeOptions.length > 0) {
          const hasValidSize = variantsWithColorQuality.some(p => p.size === prev.size);
          if (!hasValidSize) {
            newState.size = '';
          }
        }
        
        if (prev.unit && unitOptions.length > 0) {
          const filteredBySizeAsWell = variantsWithColorQuality.filter(p => 
            !newState.size || p.size === newState.size
          );
          const hasValidUnit = filteredBySizeAsWell.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = '';
          }
        }
      } else if (field === 'size') {
        // Tương tự cho kích thước
        const variantsWithColorQualitySize = allVariants.filter(p => 
          p.color === prev.color && 
          (!prev.quality || p.quality === prev.quality) && 
          p.size === value
        );
        
        if (prev.unit && unitOptions.length > 0) {
          const hasValidUnit = variantsWithColorQualitySize.some(p => p.unit === prev.unit);
          if (!hasValidUnit) {
            newState.unit = '';
          }
        }
      }
      
      return newState;
    });
  };

  const handleAddVariantToCart = () => {
    if (!selectedProductNameForVariants) {
      toast({title: "Thiếu thông tin", description: "Vui lòng chọn sản phẩm.", variant: "destructive"});
      return;
    }

    // Chỉ kiểm tra các trường thực sự có sẵn và cần thiết
    const missingFields = [];
    if (colorOptions.length > 0 && availableVariants.colors.length > 0 && !variantSelection.color) {
      missingFields.push('màu sắc');
    }
    if (productQualityOptions.length > 0 && availableVariants.qualities.length > 0 && variantSelection.quality === undefined) {
      missingFields.push('chất lượng');
    }
    if (sizeOptions.length > 0 && availableVariants.sizes.length > 0 && !variantSelection.size) {
      missingFields.push('kích thước');
    }
    if (unitOptions.length > 0 && availableVariants.units.length > 0 && !variantSelection.unit) {
      missingFields.push('đơn vị');
    }

    if (missingFields.length > 0) {
      toast({title: "Thiếu thông tin", description: `Vui lòng chọn: ${missingFields.join(', ')}.`, variant: "destructive"});
      return;
    }

    // Kiểm tra xem có chọn batch và quantity không
    const availableBatches = getAvailableBatchesForVariant();
    if (availableBatches.length > 1 && !variantSelection.batchNumber) {
      toast({title: "Thiếu thông tin", description: "Vui lòng chọn lô hàng.", variant: "destructive"});
      return;
    }

    // Tìm sản phẩm dựa trên variant selection và batch number
    let productToAdd;
    if (availableBatches.length > 1) {
      // Có nhiều lô hàng, tìm theo batch number đã chọn
      productToAdd = inventory.find(p =>
        p.name === selectedProductNameForVariants &&
        (colorOptions.length === 0 || availableVariants.colors.length === 0 || p.color === variantSelection.color) &&
        (productQualityOptions.length === 0 || availableVariants.qualities.length === 0 || p.quality === variantSelection.quality) &&
        (sizeOptions.length === 0 || availableVariants.sizes.length === 0 || p.size === variantSelection.size) &&
        (unitOptions.length === 0 || availableVariants.units.length === 0 || p.unit === variantSelection.unit) &&
        p.batchNumber === variantSelection.batchNumber &&
        p.quantity > 0
      );
    } else {
      // Chỉ có 1 lô hàng hoặc không có batch, tìm sản phẩm bình thường
      productToAdd = inventory.find(p =>
        p.name === selectedProductNameForVariants &&
        (colorOptions.length === 0 || availableVariants.colors.length === 0 || p.color === variantSelection.color) &&
        (productQualityOptions.length === 0 || availableVariants.qualities.length === 0 || p.quality === variantSelection.quality) &&
        (sizeOptions.length === 0 || availableVariants.sizes.length === 0 || p.size === variantSelection.size) &&
        (unitOptions.length === 0 || availableVariants.units.length === 0 || p.unit === variantSelection.unit) &&
        p.quantity > 0
      );
    }

    if (productToAdd) {
      // Kiểm tra số lượng hiện có trong giỏ hàng
      const existingCartItem = cart.find(item => item.id === productToAdd.id);
      const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
      const totalRequestedQuantity = quantityInCart + variantSelection.quantity;
      
      // Kiểm tra nếu tổng số lượng yêu cầu vượt quá tồn kho
      if (totalRequestedQuantity > productToAdd.quantity) {
        toast({
          title: "Số lượng vượt quá tồn kho", 
          description: `Chỉ còn có thể thêm tối đa ${productToAdd.quantity - quantityInCart} sản phẩm nữa. Hiện tại trong giỏ: ${quantityInCart}, tồn kho: ${productToAdd.quantity}.`, 
          variant: "destructive"
        });
        return;
      }
      
      // Thêm sản phẩm vào giỏ với số lượng đã chọn
      if (existingCartItem) {
        // Nếu sản phẩm đã có trong giỏ, cập nhật số lượng
        const newQuantity = existingCartItem.quantityInCart + variantSelection.quantity;
        onUpdateCartQuantity(productToAdd.id, newQuantity.toString());
      } else {
        // Nếu sản phẩm chưa có trong giỏ, thêm 1 lần đầu tiên
        onAddToCart(productToAdd);
        // Sau đó cập nhật số lượng nếu > 1
        if (variantSelection.quantity > 1) {
          onUpdateCartQuantity(productToAdd.id, variantSelection.quantity.toString());
        }
      }
      
      setIsVariantSelectorOpen(false);
      setSelectedProductNameForVariants(null);
      setVariantSelection({ color: '', quality: '', size: '', unit: '', quantity: 1 });
    } else {
      toast({title: "Không tìm thấy", description: "Không tìm thấy sản phẩm phù hợp hoặc đã hết hàng.", variant: "destructive"});
    }
  };

  const handleBatchSelection = (selectedBatch: { batchNumber: number; quantity: number; product: Product }) => {
    onAddToCart(selectedBatch.product);
    setBatchSelection({
      isOpen: false,
      productName: '',
      variantDetails: { color: '', quality: '', size: '', unit: '', quantity: 1 },
      availableBatches: []
    });
  };

  const selectedVariantDetails = useMemo(() => {
    if (!selectedProductNameForVariants) return null;

    // Kiểm tra xem tất cả các trường cần thiết đã được chọn chưa
    const needsColor = colorOptions.length > 0 && availableVariants.colors.length > 0;
    const needsQuality = productQualityOptions.length > 0 && availableVariants.qualities.length > 0;
    const needsSize = sizeOptions.length > 0 && availableVariants.sizes.length > 0;
    const needsUnit = unitOptions.length > 0 && availableVariants.units.length > 0;

    if ((needsColor && !variantSelection.color) ||
        (needsQuality && variantSelection.quality === undefined) ||
        (needsSize && !variantSelection.size) ||
        (needsUnit && !variantSelection.unit)) {
      return null;
    }

    return inventory.find(p =>
      p.name === selectedProductNameForVariants &&
      (!needsColor || p.color === variantSelection.color) &&
      (!needsQuality || p.quality === variantSelection.quality) &&
      (!needsSize || p.size === variantSelection.size) &&
      (!needsUnit || p.unit === variantSelection.unit) &&
      p.quantity > 0
    );
  }, [inventory, selectedProductNameForVariants, variantSelection, colorOptions, productQualityOptions, sizeOptions, unitOptions, availableVariants]);


  // Auto-select batch when variant changes
  useEffect(() => {
    if (selectedProductNameForVariants) {
      const availableBatches = getAvailableBatchesForVariant();
      if (availableBatches.length === 1) {
        // Tự động chọn batch duy nhất
        setVariantSelection(prev => ({ ...prev, batchNumber: availableBatches[0].batchNumber }));
      } else if (availableBatches.length > 1) {
        // Reset batch selection nếu có nhiều batch để user có thể chọn
        setVariantSelection(prev => ({ ...prev, batchNumber: undefined }));
      } else {
        // Không có batch nào available
        setVariantSelection(prev => ({ ...prev, batchNumber: undefined }));
      }
    }
  }, [selectedProductNameForVariants, variantSelection.color, variantSelection.quality, variantSelection.size, variantSelection.unit, inventory]);

  // Thumbnail selection handlers
  const handleThumbnailClick = useCallback((productName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const variantsOfProduct = inventory.filter(p => p.name === productName);
    if (variantsOfProduct.length === 0) return;
    
    const selectedProduct = variantsOfProduct[0];
    openThumbnailSelector(productName, variantsOfProduct, selectedProduct);
  }, [inventory, openThumbnailSelector]);

  const handleThumbnailSelect = useCallback(async (productId: string, thumbnailIndex: number) => {
    if (!onUpdateThumbnail) return;
    
    const product = inventory.find(p => p.id === productId);
    if (!product || !product.images || !product.images[thumbnailIndex]) return;
    
    try {
      await onUpdateThumbnail(productId, product.images[thumbnailIndex]);
      toast({
        title: "Thành công",
        description: "Đã cập nhật hình đại diện sản phẩm.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hình đại diện.",
        variant: "destructive",
      });
    }
  }, [inventory, onUpdateThumbnail, toast]);

  const getProductThumbnail = useCallback((product: Product) => {
    return getProductThumbnailUtil(product, inventory);
  }, [inventory]);

  const handleItemDiscountInputChange = (itemId: string, discountStr: string) => {
    onItemDiscountChange(itemId, discountStr);
  };

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = normalizeStringForSearch(customerSearchText);
    if (!normalizedSearch) {
      return enhancedCustomers;
    }
    return enhancedCustomers.filter(c =>
      normalizeStringForSearch(c.name).includes(normalizedSearch) ||
      (c.phone && c.phone.includes(customerSearchText))
    );
  }, [enhancedCustomers, customerSearchText]);

  interface EnhancedCustomer extends Customer {
    totalSpent: number;
    vipTier: string;
  }


  // Function to get batch color
  const getBatchColor = (batchNumber: number): string => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    return colors[(batchNumber - 1) % colors.length];
  };

  // Function to get available batches for current variant selection
  const getAvailableBatchesForVariant = () => {
    if (!selectedProductNameForVariants) return [];
    
    const matchingProducts = inventory.filter(product => 
      product.name === selectedProductNameForVariants &&
      (colorOptions.length === 0 || availableVariants.colors.length === 0 || product.color === variantSelection.color) &&
      (productQualityOptions.length === 0 || availableVariants.qualities.length === 0 || product.quality === variantSelection.quality) &&
      (sizeOptions.length === 0 || availableVariants.sizes.length === 0 || product.size === variantSelection.size) &&
      (unitOptions.length === 0 || availableVariants.units.length === 0 || product.unit === variantSelection.unit) &&
      product.quantity > 0
    );

    // Group by batch number and combine quantities
    const batchMap = new Map<number, { batchNumber: number; quantity: number; product: Product }>();
    
    matchingProducts.forEach(product => {
      const batchNumber = product.batchNumber || 1;
      if (!batchMap.has(batchNumber)) {
        batchMap.set(batchNumber, {
          batchNumber,
          quantity: product.quantity,
          product
        });
      } else {
        // If multiple products with same batch, take the one with highest quantity
        const existing = batchMap.get(batchNumber)!;
        if (product.quantity > existing.quantity) {
          batchMap.set(batchNumber, {
            batchNumber,
            quantity: product.quantity,
            product
          });
        }
      }
    });

    return Array.from(batchMap.values()).sort((a, b) => a.batchNumber - b.batchNumber);
  };

  // Debug function to log inventory changes for selected product
  useEffect(() => {
    if (selectedProductNameForVariants) {
      const matchingProducts = inventory.filter(p => 
        p.name === selectedProductNameForVariants && p.quantity > 0
      );
      console.log(`[SalesTab] Inventory update for "${selectedProductNameForVariants}":`, {
        totalProducts: matchingProducts.length,
        batches: matchingProducts.map(p => ({ 
          id: p.id, 
          batch: p.batchNumber || 1, 
          quantity: p.quantity,
          variant: `${p.color}-${p.quality}-${p.size}-${p.unit}`
        }))
      });
    }
  }, [inventory, selectedProductNameForVariants]);

  return (
    <>
      <div className="p-4 md:p-6 h-full flex flex-col">
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-foreground">Bán hàng nhanh</h3>
                <Popover open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isProductSearchOpen}
                      className="w-full justify-between bg-card text-foreground hover:text-foreground"
                    >
                      Tìm và thêm sản phẩm vào giỏ...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Gõ tên, màu, chất lượng, size hoặc đơn vị..."
                        value={productSearchQuery}
                        onValueChange={setProductSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                        <CommandGroup>
                          {distinctInStockVariants
                            .filter(variant => {
                              const normalizedLabel = normalizeStringForSearch(variant.displayLabel);
                              const normalizedQuery = normalizeStringForSearch(productSearchQuery);
                              return normalizedLabel.includes(normalizedQuery);
                            })
                            .map((variant) => (
                              <CommandItem
                                key={variant.id}
                                value={variant.id}
                                onSelect={(currentValue) => {
                                  const productToAdd = inventory.find(p => p.id === currentValue);
                                  if (productToAdd) {
                                    onAddToCart(productToAdd);
                                  }
                                  setProductSearchQuery("");
                                  setIsProductSearchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                {/* Desktop View */}
                                <div className="hidden md:grid md:grid-cols-[auto_1fr_minmax(3.5rem,auto)_minmax(4rem,auto)_minmax(4.5rem,auto)_minmax(3rem,auto)_minmax(4.5rem,auto)_minmax(3.5rem,auto)] gap-x-2 items-center w-full text-xs py-1">
                                  <Image
                                    src={variant.images?.[0] || `https://placehold.co/24x24.png`}
                                    alt={variant.name}
                                    width={10}
                                    height={10}
                                    className="w-3 h-3 rounded object-cover aspect-square border"
                                    data-ai-hint={`${variant.name.split(' ')[0]} flower`}
                                    onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/10x10.png')}
                                  />
                                  <span className="font-medium truncate" title={variant.name}>{variant.name}</span>
                                  <span className="truncate" title={variant.color}>{variant.color}</span>
                                  <span className="truncate" title={variant.quality || ''}>{variant.quality || 'N/A'}</span>
                                  <span className="truncate" title={variant.size}>{variant.size}</span>
                                  <span className="truncate" title={variant.unit}>{variant.unit}</span>
                                  <span className="text-right truncate font-semibold" title={variant.price.toLocaleString('vi-VN') + ' VNĐ'}>
                                    {variant.price.toLocaleString('vi-VN')}
                                  </span>
                                  <span className="text-right truncate" title={'Tồn: ' + variant.quantity.toString()}>{variant.quantity}</span>
                                </div>
                                {/* Mobile View */}
                                <div className="flex flex-col w-full text-xs py-1 md:hidden">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Image
                                        src={variant.images?.[0] || `https://placehold.co/24x24.png`}
                                        alt={variant.name}
                                        width={10}
                                        height={10}
                                        className="w-3 h-3 rounded object-cover aspect-square border flex-shrink-0"
                                        onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/10x10.png')}
                                      />
                                      <span className="font-medium truncate" title={variant.name}>{variant.name}</span>
                                    </div>
                                    <span className="font-semibold text-right truncate pl-2" title={variant.price.toLocaleString('vi-VN') + ' VNĐ'}>
                                      {variant.price.toLocaleString('vi-VN')} VNĐ
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pl-8 pt-1">
                                    <span className="text-muted-foreground truncate" title={`${variant.color} / ${variant.quality || 'N/A'} / ${variant.size} / ${variant.unit}`}>
                                      {`${variant.color} / ${variant.quality || 'N/A'} / ${variant.size} / ${variant.unit}`}
                                    </span>
                                    <span className="text-muted-foreground text-right truncate" title={'Tồn: ' + variant.quantity.toString()}>
                                      Tồn: {variant.quantity}
                                    </span>
                                  </div>
                                </div>
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Hoặc chọn từ danh sách sản phẩm có sẵn</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productsGroupedByName.map((group, index) => (
                    <Card
                      key={group.name}
                      className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative"
                      onClick={() => group.totalStock > 0 && openVariantSelector(group.name)}
                    >
                      <div className="aspect-square w-full overflow-hidden relative">
                        <Image
                          src={getProductThumbnail(group.firstVariant)}
                          alt={group.name}
                          fill
                          priority={index < 4}
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400.png'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Thumbnail selector button */}
                        {onUpdateThumbnail && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            onClick={(e) => handleThumbnailClick(group.name, e)}
                            title="Chọn hình đại diện"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <div className="absolute inset-0 p-4 flex flex-col">
                          <div className="flex-grow" />
                          <div className="text-white">
                            <h4 className="font-semibold whitespace-normal break-words" title={group.name}>
                                {group.name}
                            </h4>
                          </div>
                        </div>
                        {group.totalStock <= 0 && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                                <Badge variant="outline" className="text-lg">Hết hàng</Badge>
                            </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  {productsGroupedByName.length === 0 && (
                      <p className="text-muted-foreground col-span-full text-center py-4">Không có sản phẩm nào có sẵn trong kho.</p>
                  )}
                </div>
              </div>
            </div>

        </div>
      </div>

      <Dialog open={isVariantSelectorOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedProductNameForVariants(null);
          setVariantSelection({ color: '', quality: '', size: '', unit: '', quantity: 1 });
        }
        setIsVariantSelectorOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-2xl lg:max-w-4xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn thuộc tính cho: {selectedProductNameForVariants}</DialogTitle>
            <DialogDescription>
              Chọn các thuộc tính bên dưới và xem ảnh tương ứng.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 lg:grid-cols-[3fr_2fr] gap-6 py-4 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-2">
                <Carousel setApi={setCarouselApi} className="w-full relative">
                    <CarouselContent>
                        {(selectedVariantDetails?.images && selectedVariantDetails.images.length > 0 ? selectedVariantDetails.images : [`https://placehold.co/600x600.png`]).map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="relative flex-grow min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
                                    <Image
                                        src={img}
                                        alt={`${selectedVariantDetails?.name || 'Sản phẩm'} - ảnh ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="rounded-lg object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600.png'; }}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground" />
                </Carousel>
            </div>
            <div className="space-y-4">
              {colorOptions.length > 0 && availableVariants.colors.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Màu sắc</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.colors.filter(color => color && color.trim() !== '').map(color => (
                      <Button 
                        key={color} 
                        variant={variantSelection.color === color ? 'default' : 'outline'} 
                        onClick={() => handleVariantSelectionChange('color', color)} 
                        className="h-10 px-4 text-sm"
                        disabled={availableVariants.colors.length === 0}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {productQualityOptions.length > 0 && availableVariants.qualities.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Chất lượng</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.qualities.filter(quality => quality && quality.trim() !== '').map(quality => (
                      <Button 
                        key={quality} 
                        variant={variantSelection.quality === quality ? 'default' : 'outline'} 
                        onClick={() => handleVariantSelectionChange('quality', quality)} 
                        className="h-10 px-4 text-sm"
                        disabled={(colorOptions.length > 0 && availableVariants.colors.length > 0 && !variantSelection.color) || availableVariants.qualities.length === 0}
                      >
                        {quality}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {sizeOptions.length > 0 && availableVariants.sizes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Kích thước</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.sizes.filter(size => size && size.trim() !== '').map(size => (
                      <Button 
                        key={size} 
                        variant={variantSelection.size === size ? 'default' : 'outline'} 
                        onClick={() => handleVariantSelectionChange('size', size)} 
                        className="h-10 px-4 text-sm"
                        disabled={(colorOptions.length > 0 && availableVariants.colors.length > 0 && !variantSelection.color) || (productQualityOptions.length > 0 && availableVariants.qualities.length > 0 && variantSelection.quality === undefined) || availableVariants.sizes.length === 0}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {unitOptions.length > 0 && availableVariants.units.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Đơn vị</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariants.units.filter(unit => unit && unit.trim() !== '').map(unit => (
                      <Button 
                        key={unit} 
                        variant={variantSelection.unit === unit ? 'default' : 'outline'} 
                        onClick={() => handleVariantSelectionChange('unit', unit)} 
                        className="h-10 px-4 text-sm"
                        disabled={(colorOptions.length > 0 && availableVariants.colors.length > 0 && !variantSelection.color) || (productQualityOptions.length > 0 && availableVariants.qualities.length > 0 && variantSelection.quality === undefined) || (sizeOptions.length > 0 && availableVariants.sizes.length > 0 && !variantSelection.size) || availableVariants.units.length === 0}
                      >
                        {unit}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Batch Selection and Quantity - Compact Version */}
              {selectedVariantDetails && (
                <div className="space-y-3 mt-6 pt-4 border-t">
                  {getAvailableBatchesForVariant()?.length > 0 ? (
                    <div className="flex items-center gap-4">
                      {/* Batch Selection */}
                      {getAvailableBatchesForVariant()?.length > 1 && (
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-muted-foreground mb-1 block">Lô hàng</Label>
                          <div className="flex gap-1 flex-wrap">
                            {getAvailableBatchesForVariant()?.map((batch) => {
                              const isSelected = variantSelection.batchNumber === batch.batchNumber;
                              return (
                                <button
                                  key={`${batch.batchNumber}-${batch.product.id}`}
                                  type="button"
                                  onClick={() => setVariantSelection(prev => ({ ...prev, batchNumber: batch.batchNumber }))}
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                                    isSelected 
                                      ? 'border-primary bg-primary text-primary-foreground' 
                                      : 'border-border hover:border-primary/50 bg-background'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${getBatchColor(batch.batchNumber)}`}></span>
                                  <span className="font-medium">{batch.batchNumber}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Quantity Selection */}
                      <div className="flex-shrink-0">
                        <Label className="text-sm font-medium text-muted-foreground mb-1 block">Số lượng</Label>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVariantSelection(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                            disabled={variantSelection.quantity <= 1}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={variantSelection.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              // Lấy số lượng tồn kho hiện tại
                              const availableBatches = getAvailableBatchesForVariant();
                              const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                              const stockInWarehouse = selectedBatch ? selectedBatch.quantity : (selectedVariantDetails?.quantity || 0);
                              
                              // Kiểm tra số lượng trong giỏ hàng
                              const existingCartItem = cart.find(item => item.id === (selectedBatch?.product.id || selectedVariantDetails?.id));
                              const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
                              const maxCanAdd = stockInWarehouse - quantityInCart;
                              
                              // Giới hạn số lượng nhập không vượt quá số có thể thêm
                              const clampedValue = Math.max(1, Math.min(value, maxCanAdd));
                              setVariantSelection(prev => ({ ...prev, quantity: clampedValue }));
                            }}
                            className="w-12 h-8 text-center mx-1 text-sm hide-number-spinners"
                            min="1"
                            max={(() => {
                              const availableBatches = getAvailableBatchesForVariant();
                              const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                              const stockInWarehouse = selectedBatch ? selectedBatch.quantity : (selectedVariantDetails?.quantity || 1);
                              const existingCartItem = cart.find(item => item.id === (selectedBatch?.product.id || selectedVariantDetails?.id));
                              const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
                              return Math.max(1, stockInWarehouse - quantityInCart);
                            })()}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVariantSelection(prev => {
                              // Lấy số lượng tồn kho hiện tại
                              const availableBatches = getAvailableBatchesForVariant();
                              const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                              const stockInWarehouse = selectedBatch ? selectedBatch.quantity : (selectedVariantDetails?.quantity || 0);
                              
                              // Kiểm tra số lượng trong giỏ hàng
                              const existingCartItem = cart.find(item => item.id === (selectedBatch?.product.id || selectedVariantDetails?.id));
                              const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
                              const maxCanAdd = stockInWarehouse - quantityInCart;
                              
                              // Chỉ tăng nếu chưa đạt giới hạn có thể thêm
                              return { ...prev, quantity: Math.min(prev.quantity + 1, maxCanAdd) };
                            })}
                            disabled={(() => {
                              const availableBatches = getAvailableBatchesForVariant();
                              const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                              const stockInWarehouse = selectedBatch ? selectedBatch.quantity : (selectedVariantDetails?.quantity || 0);
                              const existingCartItem = cart.find(item => item.id === (selectedBatch?.product.id || selectedVariantDetails?.id));
                              const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
                              const maxCanAdd = stockInWarehouse - quantityInCart;
                              return variantSelection.quantity >= maxCanAdd;
                            })()}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {/* Hiển thị thông tin tồn kho */}
                        <div className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const availableBatches = getAvailableBatchesForVariant();
                            const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                            const stockInWarehouse = selectedBatch ? selectedBatch.quantity : (selectedVariantDetails?.quantity || 0);
                            
                            // Kiểm tra số lượng trong giỏ hàng
                            const existingCartItem = cart.find(item => item.id === (selectedBatch?.product.id || selectedVariantDetails?.id));
                            const quantityInCart = existingCartItem ? existingCartItem.quantityInCart : 0;
                            const availableToAdd = stockInWarehouse - quantityInCart;
                            
                            if (quantityInCart > 0) {
                              return `Tồn kho: ${stockInWarehouse} | Trong giỏ: ${quantityInCart} | Có thể thêm: ${availableToAdd}`;
                            } else {
                              return `Tồn kho: ${stockInWarehouse} sản phẩm`;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium">Không có lô hàng nào khả dụng</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg min-w-[200px]">
            {selectedVariantDetails ? (
              <div className="flex items-center gap-4">
                {/* Display price based on selected batch */}
                {(() => {
                  const availableBatches = getAvailableBatchesForVariant();
                  const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                  const priceToShow = selectedBatch ? selectedBatch.product.price : selectedVariantDetails.price;
                  
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Giá:</span>
                      <span className="bg-green-500 text-white font-bold text-sm px-2 py-1 rounded">
                        {priceToShow.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  );
                })()}
                
                {/* Display stock based on selected batch */}
                {(() => {
                  const availableBatches = getAvailableBatchesForVariant();
                  const selectedBatch = availableBatches.find(batch => batch.batchNumber === variantSelection.batchNumber);
                  const stockToShow = selectedBatch ? selectedBatch.quantity : selectedVariantDetails.quantity;
                  
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tồn kho:</span>
                      <span className="bg-blue-500 text-white font-bold text-sm px-2 py-1 rounded">
                        {stockToShow}
                      </span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                Chọn thuộc tính để xem thông tin
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantSelectorOpen(false)}>Hủy</Button>
            <Button 
              onClick={handleAddVariantToCart} 
              disabled={!selectedVariantDetails || (getAvailableBatchesForVariant()?.length > 1 && !variantSelection.batchNumber)} 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Thêm {variantSelection.quantity > 1 ? `${variantSelection.quantity} ` : ''}vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin thanh toán</DialogTitle>
            <DialogDescription>
              Vui lòng kiểm tra và nhập thông tin thanh toán.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="customer-search">Tên khách hàng</Label>
              <div
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsCustomerSearchFocused(false);
                  }
                }}
              >
                <Input
                  id="customer-search"
                  placeholder="Tìm khách hàng..."
                  value={customerSearchText}
                  onChange={(e) => setCustomerSearchText(e.target.value)}
                  onFocus={() => setIsCustomerSearchFocused(true)}
                  className="bg-card"
                />
                {isCustomerSearchFocused && (
                  <Card className="absolute w-full z-10 mt-1 bg-card border shadow-lg max-h-60 overflow-y-auto">
                    <CardContent className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 text-left h-auto"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearchText('');
                          setIsCustomerSearchFocused(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !selectedCustomer ? 'opacity-100' : 'opacity-0')} />
                        <span className="font-medium">Khách lẻ</span>
                      </Button>
                      {filteredCustomers.map((customer) => (
                        <Button
                          key={customer.id}
                          variant="ghost"
                          className={cn("w-full justify-start p-2 text-left h-auto", getVipTierStyling(customer.vipTier))}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearchText('');
                            setIsCustomerSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center w-full gap-2">
                              <Check className={cn("h-4 w-4 flex-shrink-0", selectedCustomer?.id === customer.id ? 'opacity-100' : 'opacity-0')} />
                              <div className="flex items-center justify-between w-full min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="font-medium text-sm">{customer.name}</span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">{formatPhoneNumber(customer.phone)}</span>
                                  </div>
                                  <Badge
                                      variant="outline"
                                      className={cn("font-semibold text-xs flex-shrink-0 ml-2", getVipTierStyling(customer.vipTier))}
                                  >
                                      {customer.vipTier}
                                  </Badge>
                              </div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2 p-2 bg-muted/30 rounded">
                <span className="text-xs">Đang chọn:</span>
                {selectedCustomer ? (
                  <>
                    <span className="font-semibold text-foreground">{selectedCustomer.name}</span>
                    <span className="text-xs">•</span>
                    <span className="text-xs">{formatPhoneNumber(selectedCustomer.phone)}</span>
                    <Badge
                      variant="outline"
                      className={cn("font-semibold text-xs ml-auto", getVipTierStyling(selectedCustomer.vipTier))}
                    >
                      {selectedCustomer.vipTier}
                    </Badge>
                  </>
                ) : (
                  <span className="font-semibold text-foreground">Khách lẻ</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Label>Tổng tiền hàng (sau Giảm giá SP):</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{subtotalAfterItemDiscounts.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            <div>
                <Label className="mb-2 block">Phương thức thanh toán</Label>
                <RadioGroup value={currentPaymentMethod} onValueChange={setCurrentPaymentMethod} className="flex space-x-4">
                    {paymentOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`payment-${option}`} />
                        <Label htmlFor={`payment-${option}`}>{option}</Label>
                    </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="flex justify-between items-center text-red-500">
              <Label className={cn("text-red-500", numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Thành tiền:</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{finalTotalAfterAllDiscounts.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <Separator/>

            <div className="space-y-1">
              <Label htmlFor="amountPaid" className={cn(numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Số tiền khách trả (Nghìn VND)</Label>
              <Input
                id="amountPaid"
                type="number"
                value={amountPaidStr}
                onChange={(e) => setAmountPaidStr(e.target.value)}
                min="0"
                className="bg-card hide-number-spinners"
              />
            </div>


            <div className="flex justify-between items-center">
              <Label className={cn(numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Tiền thừa:</Label>
              <span className={cn("font-semibold", numericDisplaySize)}>{changeVND >= 0 && actualAmountPaidVND > 0 && actualAmountPaidVND >= finalTotalAfterAllDiscounts ? changeVND.toLocaleString('vi-VN') : '0'} VNĐ</span>
            </div>
            {finalTotalAfterAllDiscounts > actualAmountPaidVND && selectedCustomer && currentPaymentMethod !== 'Chuyển khoản' && (
                 <div className="flex justify-between items-center text-red-600">
                    <Label className={cn("text-red-600", numericDisplaySize === "text-xl" ? "text-lg" : numericDisplaySize === "text-2xl" ? "text-xl" : numericDisplaySize === "text-3xl" ? "text-2xl" : "text-3xl" )}>Còn nợ:</Label>
                    <span className={cn("font-semibold", numericDisplaySize)}>{(finalTotalAfterAllDiscounts - actualAmountPaidVND).toLocaleString('vi-VN')} VNĐ</span>
                </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCheckout}
              className="w-full bg-green-500 text-white hover:bg-green-600"
              disabled={
                finalTotalAfterAllDiscounts < 0 ||
                (!selectedCustomer && finalTotalAfterAllDiscounts > actualAmountPaidVND && currentPaymentMethod !== 'Chuyển khoản') || 
                (currentPaymentMethod === 'Chuyển khoản' && finalTotalAfterAllDiscounts > actualAmountPaidVND) ||
                !areAllItemDiscountsValid
              }
            >
              Xác nhận thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn lô hàng */}
      <Dialog open={batchSelection.isOpen} onOpenChange={(open) => {
        if (!open) {
          setBatchSelection({
            isOpen: false,
            productName: '',
            variantDetails: { color: '', quality: '', size: '', unit: '', quantity: 1 },
            availableBatches: []
          });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn lô hàng</DialogTitle>
            <DialogDescription>
              Sản phẩm "{batchSelection.productName}" có nhiều lô hàng. Vui lòng chọn lô hàng để thêm vào giỏ hàng.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {batchSelection.availableBatches.map((batch, index) => {
              const isOldestBatch = index === 0;
              const isNewestBatch = index === batchSelection.availableBatches.length - 1;
              
              let ageLabel = '';
              if (batchSelection.availableBatches.length > 1) {
                if (isOldestBatch) ageLabel = ' (Cũ nhất)';
                else if (isNewestBatch) ageLabel = ' (Mới nhất)';
              }
              
              return (
                <Button
                  key={`${batch.product.id}-${batch.batchNumber}`}
                  variant="outline"
                  className="w-full justify-between p-4 h-auto"
                  onClick={() => handleBatchSelection(batch)}
                >
                  <div className="text-left">
                    <div className="font-medium">
                      Lô {batch.batchNumber}{ageLabel}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tồn kho: {batch.quantity} | Giá: {batch.product.price.toLocaleString('vi-VN')} VNĐ
                    </div>
                    {batch.product.costPrice && (
                      <div className="text-xs text-muted-foreground">
                        Giá gốc: {batch.product.costPrice.toLocaleString('vi-VN')} VNĐ
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Badge 
                      variant={isOldestBatch ? "destructive" : isNewestBatch ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {isOldestBatch ? "Ưu tiên bán" : isNewestBatch ? "Mới nhất" : "Trung bình"}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBatchSelection({
                isOpen: false,
                productName: '',
                variantDetails: { color: '', quality: '', size: '', unit: '', quantity: 1 },
                availableBatches: []
              })}
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Thumbnail Selector Dialog */}
      <ThumbnailSelector
        isOpen={thumbnailState.isOpen}
        onClose={closeThumbnailSelector}
        products={thumbnailState.products}
        selectedProduct={thumbnailState.selectedProduct!}
        onThumbnailSelect={handleThumbnailSelect}
      />
    </>
  );
});

SalesTab.displayName = 'SalesTab';
