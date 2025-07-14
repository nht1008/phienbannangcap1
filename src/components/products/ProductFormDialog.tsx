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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductFormData, ProductAttributeSelection } from '@/types'; // Using ProductFormData
import { UploadCloud, X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ui/image-upload";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id'>, isEditMode: boolean, productId?: string) => Promise<boolean>;
  initialData?: Product | null;
  productNameOptions: string[];
  colorOptions: string[];
  productQualityOptions: string[];
  sizeOptions: string[];
  unitOptions: string[];
  isEditMode: boolean;
  defaultFormState: ProductFormData; // Pass default state from parent
  inventory?: Product[]; // Danh sách sản phẩm có sẵn trong kho
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  productNameOptions,
  colorOptions,
  productQualityOptions,
  sizeOptions,
  unitOptions,
  isEditMode,
  defaultFormState,
  inventory = [],
}: ProductFormDialogProps) {
  const [formState, setFormState] = useState<ProductFormData>(defaultFormState);
  const [currentImages, setCurrentImages] = useState<Array<{ url: string; publicId?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  // State để quản lý suggestions cho từng thuộc tính
  const [showColorSuggestions, setShowColorSuggestions] = useState(false);
  const [filteredColorSuggestions, setFilteredColorSuggestions] = useState<string[]>([]);
  const [showQualitySuggestions, setShowQualitySuggestions] = useState(false);
  const [filteredQualitySuggestions, setFilteredQualitySuggestions] = useState<string[]>([]);
  const [showSizeSuggestions, setShowSizeSuggestions] = useState(false);
  const [filteredSizeSuggestions, setFilteredSizeSuggestions] = useState<string[]>([]);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [filteredUnitSuggestions, setFilteredUnitSuggestions] = useState<string[]>([]);
  
  // State để quản lý trạng thái checkbox của các thuộc tính
  const [attributeSelection, setAttributeSelection] = useState<ProductAttributeSelection>({
    color: false,
    quality: false,
    size: false,
    unit: false,
  });
  
  const { toast } = useToast();

  // Hàm chuyển đổi tiếng Việt có dấu thành không dấu để so sánh thông minh
  const removeVietnameseAccents = (str: string): string => {
    const accents = {
      'à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ': 'a',
      'è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ': 'e',
      'ì|í|ị|ỉ|ĩ': 'i',
      'ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ': 'o',
      'ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ': 'u',
      'ỳ|ý|ỵ|ỷ|ỹ': 'y',
      'đ': 'd',
      'À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ': 'A',
      'È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ': 'E',
      'Ì|Í|Ị|Ỉ|Ĩ': 'I',
      'Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ': 'O',
      'Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ': 'U',
      'Ỳ|Ý|Ỵ|Ỷ|Ỹ': 'Y',
      'Đ': 'D'
    };

    let result = str;
    for (const [accented, plain] of Object.entries(accents)) {
      const regex = new RegExp(accented, 'g');
      result = result.replace(regex, plain);
    }
    return result;
  };

  // Hàm so sánh thông minh cho tiếng Việt
  const smartVietnameseMatch = (searchText: string, targetText: string): boolean => {
    // Chuyển về lowercase và loại bỏ dấu
    const normalizedSearch = removeVietnameseAccents(searchText.toLowerCase());
    const normalizedTarget = removeVietnameseAccents(targetText.toLowerCase());
    
    // 1. Kiểm tra khớp trực tiếp
    if (normalizedTarget.includes(normalizedSearch)) {
      return true;
    }
    
    // 2. Kiểm tra khớp khi loại bỏ khoảng trắng từ cả search và target
    const searchNoSpaces = normalizedSearch.replace(/\s+/g, '');
    const targetNoSpaces = normalizedTarget.replace(/\s+/g, '');
    if (targetNoSpaces.includes(searchNoSpaces)) {
      return true;
    }
    
    // 3. Kiểm tra khớp từng từ riêng lẻ (flexible word matching)
    const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);
    const targetWords = normalizedTarget.split(/\s+/).filter(word => word.length > 0);
    
    // Tất cả từ trong search phải có trong target (không cần theo thứ tự)
    const allWordsMatch = searchWords.every(searchWord => 
      targetWords.some(targetWord => 
        targetWord.includes(searchWord) || searchWord.includes(targetWord)
      )
    );
    
    if (allWordsMatch) {
      return true;
    }
    
    // 4. Kiểm tra pattern matching thông minh (ví dụ: "hongdalat" match "hồng đà lạt")
    // Chia search text thành các phần có thể
    if (searchNoSpaces.length >= 3) {
      // Tạo các combination có thể từ search text
      const targetWordsJoined = targetWords.join('');
      
      // Kiểm tra subsequence matching
      let searchIndex = 0;
      for (let i = 0; i < targetWordsJoined.length && searchIndex < searchNoSpaces.length; i++) {
        if (targetWordsJoined[i] === searchNoSpaces[searchIndex]) {
          searchIndex++;
        }
      }
      
      // Nếu match được ít nhất 70% ký tự
      if (searchIndex / searchNoSpaces.length >= 0.7) {
        return true;
      }
    }
    
    // 5. Kiểm tra viết tắt (ví dụ: "hdl" match "hồng đà lạt")
    if (searchNoSpaces.length <= targetWords.length && searchNoSpaces.length >= 2) {
      const firstLetters = targetWords.map(word => word.charAt(0)).join('');
      if (firstLetters.includes(searchNoSpaces) || searchNoSpaces.includes(firstLetters)) {
        return true;
      }
    }
    
    return false;
  };

  // Hàm highlight text khớp với search
  const highlightMatch = (text: string, search: string): React.ReactNode => {
    if (!search.trim()) return text;
    
    const normalizedSearch = removeVietnameseAccents(search.toLowerCase());
    const normalizedText = removeVietnameseAccents(text.toLowerCase());
    
    // Tìm vị trí khớp
    const matchIndex = normalizedText.indexOf(normalizedSearch);
    if (matchIndex === -1) return text;
    
    const beforeMatch = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + search.length);
    const afterMatch = text.substring(matchIndex + search.length);
    
    return (
      <>
        {beforeMatch}
        <span className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{match}</span>
        {afterMatch}
      </>
    );
  };

  // Hàm tính điểm độ liên quan
  const calculateRelevanceScore = (searchText: string, targetText: string): number => {
    const normalizedSearch = removeVietnameseAccents(searchText.toLowerCase());
    const normalizedTarget = removeVietnameseAccents(targetText.toLowerCase());
    
    let score = 0;
    
    // Exact match gets highest score
    if (normalizedTarget === normalizedSearch) return 100;
    
    // Starts with search text
    if (normalizedTarget.startsWith(normalizedSearch)) score += 50;
    
    // Contains search text as whole word
    if (normalizedTarget.includes(` ${normalizedSearch} `) || 
        normalizedTarget.startsWith(`${normalizedSearch} `) ||
        normalizedTarget.endsWith(` ${normalizedSearch}`)) {
      score += 40;
    }
    
    // Contains search text anywhere
    if (normalizedTarget.includes(normalizedSearch)) score += 30;
    
    // Word order match
    const searchWords = normalizedSearch.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    let wordMatches = 0;
    
    searchWords.forEach(searchWord => {
      if (targetWords.some(targetWord => targetWord.includes(searchWord))) {
        wordMatches++;
        score += 10;
      }
    });
    
    // Subsequence match bonus
    let searchIndex = 0;
    const targetNoSpaces = normalizedTarget.replace(/\s+/g, '');
    const searchNoSpaces = normalizedSearch.replace(/\s+/g, '');
    
    for (let i = 0; i < targetNoSpaces.length && searchIndex < searchNoSpaces.length; i++) {
      if (targetNoSpaces[i] === searchNoSpaces[searchIndex]) {
        searchIndex++;
      }
    }
    
    const subsequenceRatio = searchIndex / searchNoSpaces.length;
    score += subsequenceRatio * 20;
    
    return score;
  };

  // Tạo danh sách tên sản phẩm duy nhất cho gợi ý
  const availableProductSuggestions = React.useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    
    // Lấy danh sách tên sản phẩm duy nhất
    const uniqueProductNames = Array.from(new Set(inventory.map(product => product.name)));
    
    return uniqueProductNames.map(name => ({
      name: name,
      fullDescription: name
    }));
  }, [inventory]);

  const isFormInvalid = React.useMemo(() => {
    const { name, color, quality, size, unit, quantity, price, costPrice } = formState;
    
    // Kiểm tra các trường bắt buộc cơ bản
    if (!name || !quantity || !price || !costPrice) {
      return true;
    }
    
    // Kiểm tra các trường được chọn trong checkbox
    if (attributeSelection.color && !color) return true;
    if (attributeSelection.quality && !quality) return true;
    if (attributeSelection.size && !size) return true;
    if (attributeSelection.unit && !unit) return true;
    
    // Kiểm tra giá bán phải lớn hơn giá gốc
    const priceNum = parseFloat(price);
    const costPriceNum = parseFloat(costPrice);
    if (!isNaN(priceNum) && !isNaN(costPriceNum) && costPriceNum > 0 && priceNum <= costPriceNum) {
      return true;
    }
    return false;
  }, [formState, attributeSelection]);

  useEffect(() => {
    const placeholderImage = `https://placehold.co/100x100.png`;
    if (isOpen) {
      if (isEditMode && initialData) {
        const populatedFormState: ProductFormData = {
          name: initialData.name,
          color: initialData.color,
          quality: initialData.quality || (productQualityOptions.length > 0 ? productQualityOptions[0] : ''),
          size: initialData.size,
          unit: initialData.unit,
          quantity: initialData.quantity.toString(),
          price: (initialData.price / 1000).toString(),
          costPrice: initialData.costPrice ? (initialData.costPrice / 1000).toString() : (initialData.costPrice === 0 ? '0' : ''),
          images: initialData.images && initialData.images.length > 0 ? initialData.images : [placeholderImage],
        };
        setFormState(populatedFormState);
        
        // Trong edit mode, chỉ hiển thị ảnh thật, không hiển thị placeholder
        const realImages = initialData.images && initialData.images.length > 0 
          ? initialData.images.filter(url => !url.includes('placehold.co') && !url.includes('100x100'))
          : [];
        
        if (realImages.length === 0 && (!initialData.images || initialData.images.length === 0)) {
          // Nếu không có ảnh thật nào, hiển thị placeholder
          setCurrentImages([{ url: placeholderImage }]);
        } else {
          // Chỉ hiển thị ảnh thật
          setCurrentImages(realImages.map(url => ({ url })));
        }
        
        // Trong chế độ edit, chỉ bật các thuộc tính mà sản phẩm đã có giá trị trước đó
        setAttributeSelection({
          color: !!(initialData.color && initialData.color.trim()),
          quality: !!(initialData.quality && initialData.quality.trim()),
          size: !!(initialData.size && initialData.size.trim()),
          unit: !!(initialData.unit && initialData.unit.trim()),
        });
      } else {
        // Trong chế độ thêm mới, bắt đầu với form trống (không có ảnh)
        setFormState({
          ...defaultFormState,
          images: [] // Không có ảnh nào trong chế độ thêm mới
        });
        setCurrentImages([]); // Không hiển thị ảnh nào
        
        // Trong chế độ thêm mới, mặc định không chọn thuộc tính nào
        setAttributeSelection({
          color: false,
          quality: false,
          size: false,
          unit: false,
        });
      }
    } else {
      // Reset when closed if not controlled externally more tightly
      setFormState(defaultFormState);
      setCurrentImages([]);
      setAttributeSelection({
        color: false,
        quality: false,
        size: false,
        unit: false,
      });
    }
  }, [isOpen, isEditMode, initialData, productQualityOptions, defaultFormState]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    
    // Handle autocomplete for product name với tính năng tìm kiếm thông minh
    if (name === 'name') {
      if (value.trim()) {
        const filtered = availableProductSuggestions
          .filter(suggestion => smartVietnameseMatch(value.trim(), suggestion.fullDescription))
          .map(suggestion => ({
            ...suggestion,
            score: calculateRelevanceScore(value.trim(), suggestion.fullDescription)
          }))
          .sort((a, b) => b.score - a.score) // Sắp xếp theo điểm từ cao đến thấp
          .slice(0, 8); // Giới hạn 8 kết quả tốt nhất
        
        setFilteredSuggestions(filtered.map(s => s.fullDescription));
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
    
    // Handle autocomplete for color - Chỉ hiển thị gợi ý có sẵn
    if (name === 'color') {
      if (value.trim()) {
        // Lọc và hiển thị gợi ý từ danh sách có sẵn
        const filtered = colorOptions
          .filter(option => smartVietnameseMatch(value.trim(), option))
          .map(option => ({
            option,
            score: calculateRelevanceScore(value.trim(), option)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        
        setFilteredColorSuggestions(filtered.map(s => s.option));
        setShowColorSuggestions(filtered.length > 0);
      } else {
        setShowColorSuggestions(false);
      }
    }
    
    // Handle autocomplete for quality - Chỉ hiển thị gợi ý có sẵn
    if (name === 'quality') {
      if (value.trim()) {
        const filtered = productQualityOptions
          .filter(option => smartVietnameseMatch(value.trim(), option))
          .map(option => ({
            option,
            score: calculateRelevanceScore(value.trim(), option)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        
        setFilteredQualitySuggestions(filtered.map(s => s.option));
        setShowQualitySuggestions(filtered.length > 0);
      } else {
        setShowQualitySuggestions(false);
      }
    }
    
    // Handle autocomplete for size - Chỉ hiển thị gợi ý có sẵn
    if (name === 'size') {
      if (value.trim()) {
        const filtered = sizeOptions
          .filter(option => smartVietnameseMatch(value.trim(), option))
          .map(option => ({
            option,
            score: calculateRelevanceScore(value.trim(), option)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        
        setFilteredSizeSuggestions(filtered.map(s => s.option));
        setShowSizeSuggestions(filtered.length > 0);
      } else {
        setShowSizeSuggestions(false);
      }
    }
    
    // Handle autocomplete for unit - Chỉ hiển thị gợi ý có sẵn
    if (name === 'unit') {
      if (value.trim()) {
        const filtered = unitOptions
          .filter(option => smartVietnameseMatch(value.trim(), option))
          .map(option => ({
            option,
            score: calculateRelevanceScore(value.trim(), option)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        
        setFilteredUnitSuggestions(filtered.map(s => s.option));
        setShowUnitSuggestions(filtered.length > 0);
      } else {
        setShowUnitSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Chỉ cần set tên sản phẩm từ suggestion
    setFormState(prev => ({ ...prev, name: suggestion }));
    setShowSuggestions(false);
  };

  // Hàm xử lý click suggestion cho các thuộc tính khác
  const handleColorSuggestionClick = (suggestion: string) => {
    setFormState(prev => ({ ...prev, color: suggestion }));
    setShowColorSuggestions(false);
  };

  const handleQualitySuggestionClick = (suggestion: string) => {
    setFormState(prev => ({ ...prev, quality: suggestion }));
    setShowQualitySuggestions(false);
  };

  const handleSizeSuggestionClick = (suggestion: string) => {
    setFormState(prev => ({ ...prev, size: suggestion }));
    setShowSizeSuggestions(false);
  };

  const handleUnitSuggestionClick = (suggestion: string) => {
    setFormState(prev => ({ ...prev, unit: suggestion }));
    setShowUnitSuggestions(false);
  };

  const handleAttributeSelectionChange = (attribute: keyof ProductAttributeSelection, checked: boolean) => {
    setAttributeSelection(prev => ({ ...prev, [attribute]: checked }));
    
    // Nếu bỏ chọn thuộc tính, xóa giá trị của nó
    if (!checked) {
      setFormState(prev => ({ 
        ...prev, 
        [attribute]: '' 
      }));
    }
  };

  const handleImageUploaded = (url: string, publicId: string) => {
    const newImage = { url, publicId };
    
    setCurrentImages(prev => {
      // Loại bỏ tất cả ảnh placeholder khi có ảnh thật được upload
      const filteredImages = prev.filter(img => 
        !img.url.includes('placehold.co') && 
        !img.url.includes('100x100')
      );
      return [...filteredImages, newImage];
    });
    
    setFormState(prev => {
      // Loại bỏ tất cả ảnh placeholder khỏi formState khi có ảnh thật
      const filteredUrls = prev.images.filter(imgUrl => 
        !imgUrl.includes('placehold.co') && 
        !imgUrl.includes('100x100')
      );
      return { ...prev, images: [...filteredUrls, url] };
    });
  };

  const handleImageRemoved = (publicId: string) => {
    setCurrentImages(prev => {
      const filteredImages = prev.filter(img => img.publicId !== publicId);
      
      // Nếu không còn ảnh nào và đang ở chế độ edit, hiển thị lại placeholder
      if (filteredImages.length === 0 && isEditMode) {
        return [{ url: 'https://placehold.co/100x100.png' }];
      }
      
      return filteredImages;
    });
    
    setFormState(prev => {
      const filteredUrls = prev.images.filter((url, index) => {
        const imgWithPublicId = currentImages.find(img => img.url === url);
        return imgWithPublicId?.publicId !== publicId;
      });
      
      // Nếu không còn ảnh nào và đang ở chế độ edit, thêm placeholder vào formState
      if (filteredUrls.length === 0 && isEditMode) {
        return { ...prev, images: ['https://placehold.co/100x100.png'] };
      }
      
      return { ...prev, images: filteredUrls };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formState.price);
    const costPriceNum = parseFloat(formState.costPrice);
    const quantityNum = parseInt(formState.quantity);

    // Basic validation for numbers, though the form should prevent submission if invalid.
    if (isNaN(quantityNum) || isNaN(priceNum) || isNaN(costPriceNum)) {
        toast({ title: "Lỗi", description: "Các trường số không hợp lệ.", variant: "destructive" });
        return;
    }

    if (priceNum <= costPriceNum && costPriceNum > 0) {
      toast({ title: "Lỗi", description: "Giá bán phải lớn hơn giá gốc (nếu giá gốc > 0).", variant: "destructive" });
      return;
    }

    // Tạo batchNumber cho sản phẩm mới
    let batchNumber = 1;
    if (!isEditMode) {
      // Kiểm tra sản phẩm cùng thuộc tính để tính lô hàng
      const sameProducts = inventory.filter(product => {
        const nameMatch = product.name?.toLowerCase() === formState.name?.toLowerCase();
        const colorMatch = !attributeSelection.color || !formState.color || 
                          product.color?.toLowerCase() === formState.color?.toLowerCase();
        const qualityMatch = !attributeSelection.quality || !formState.quality || 
                            product.quality?.toLowerCase() === formState.quality?.toLowerCase();
        return nameMatch && colorMatch && qualityMatch;
      });

      console.log('ProductFormDialog - Checking for same products:', {
        searchCriteria: {
          name: formState.name,
          color: attributeSelection.color ? formState.color : 'không áp dụng',
          quality: attributeSelection.quality ? formState.quality : 'không áp dụng'
        },
        sameProducts: sameProducts.map(p => ({
          name: p.name,
          color: p.color,
          quality: p.quality,
          batchNumber: p.batchNumber
        }))
      });

      if (sameProducts.length > 0) {
        // Có sản phẩm cùng thuộc tính, tạo lô hàng mới
        const maxBatch = Math.max(...sameProducts.map(p => p.batchNumber || 1));
        batchNumber = maxBatch + 1;
        console.log('ProductFormDialog - Found existing products, new batch:', batchNumber);
      } else {
        // Sản phẩm mới hoàn toàn, bắt đầu từ lô 1
        batchNumber = 1;
        console.log('ProductFormDialog - New product, starting batch 1');
      }
    } else if (initialData?.batchNumber) {
      // Giữ nguyên batchNumber cho sản phẩm đang chỉnh sửa
      batchNumber = initialData.batchNumber;
    }

    const productData: Omit<Product, 'id'> = {
      name: formState.name,
      quantity: quantityNum,
      price: priceNum * 1000,
      costPrice: costPriceNum * 1000,
      images: formState.images.length > 0 ? formState.images : [`https://placehold.co/100x100.png`],
      color: attributeSelection.color ? formState.color : '',
      quality: attributeSelection.quality ? formState.quality : '',
      size: attributeSelection.size ? formState.size : '',
      unit: attributeSelection.unit ? formState.unit : '',
      batchNumber: batchNumber,
    };
    const success = await onSubmit(productData, isEditMode, initialData?.id);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Cập nhật thông tin chi tiết cho sản phẩm.' : 'Điền thông tin để thêm sản phẩm vào kho hàng.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 pr-6">
          {/* Checkbox tập hợp ở đầu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="header-color-checkbox"
                checked={attributeSelection.color}
                onCheckedChange={(checked) => handleAttributeSelectionChange('color', checked as boolean)}
              />
              <Label htmlFor="header-color-checkbox" className="text-sm text-foreground font-medium">Màu sắc</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="header-quality-checkbox"
                checked={attributeSelection.quality}
                onCheckedChange={(checked) => handleAttributeSelectionChange('quality', checked as boolean)}
              />
              <Label htmlFor="header-quality-checkbox" className="text-sm text-foreground font-medium">Chất lượng</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="header-size-checkbox"
                checked={attributeSelection.size}
                onCheckedChange={(checked) => handleAttributeSelectionChange('size', checked as boolean)}
              />
              <Label htmlFor="header-size-checkbox" className="text-sm text-foreground font-medium">Kích thước</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="header-unit-checkbox"
                checked={attributeSelection.unit}
                onCheckedChange={(checked) => handleAttributeSelectionChange('unit', checked as boolean)}
              />
              <Label htmlFor="header-unit-checkbox" className="text-sm text-foreground font-medium">Đơn vị</Label>
            </div>
          </div>

          {/* Các trường nhập liệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
          
          {/* Tên sản phẩm - Bắt buộc */}
          <div className="relative">
              <Label htmlFor="prodForm-name" className="text-sm text-foreground">Tên sản phẩm (*)</Label>
              <Input 
                id="prodForm-name" 
                type="text" 
                name="name" 
                value={formState.name} 
                onChange={handleInputChange} 
                onFocus={() => {
                  if (formState.name.trim()) {
                    const filtered = availableProductSuggestions
                      .filter(suggestion => smartVietnameseMatch(formState.name.trim(), suggestion.fullDescription))
                      .map(suggestion => ({
                        ...suggestion,
                        score: calculateRelevanceScore(formState.name.trim(), suggestion.fullDescription)
                      }))
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 8);
                    
                    setFilteredSuggestions(filtered.map(s => s.fullDescription));
                    setShowSuggestions(filtered.length > 0);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow click
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                required 
                className="bg-card"
                placeholder="Nhập tên sản phẩm (có thể bỏ dấu, viết liền)"
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border/30 last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">
                        {highlightMatch(suggestion, formState.name)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Màu sắc - Tùy chọn */}
          <div className="relative">
              <Label htmlFor="prodForm-color" className="text-sm text-foreground">Màu sắc</Label>
              <Input 
                id="prodForm-color" 
                type="text" 
                name="color" 
                value={attributeSelection.color ? formState.color : ''} 
                onChange={handleInputChange} 
                onFocus={() => {
                  if (attributeSelection.color) {
                    if (formState.color && formState.color.trim()) {
                      // Hiển thị gợi ý dựa trên text hiện tại
                      const filtered = colorOptions
                        .filter(option => smartVietnameseMatch(formState.color.trim(), option))
                        .map(option => ({
                          option,
                          score: calculateRelevanceScore(formState.color.trim(), option)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);
                      
                      setFilteredColorSuggestions(filtered.map(s => s.option));
                      setShowColorSuggestions(filtered.length > 0);
                    } else {
                      // Hiển thị tất cả options có sẵn khi field trống
                      setFilteredColorSuggestions(colorOptions.slice(0, 8));
                      setShowColorSuggestions(colorOptions.length > 0);
                    }
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowColorSuggestions(false), 200);
                }}
                disabled={!attributeSelection.color}
                className={`w-full ${attributeSelection.color ? 'bg-card' : 'bg-muted'}`}
                placeholder={attributeSelection.color ? "Nhập hoặc chọn màu sắc" : "Bỏ qua màu sắc"}
                autoComplete="off"
              />
              {showColorSuggestions && filteredColorSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {filteredColorSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border/30 last:border-b-0"
                      onClick={() => handleColorSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">
                        {highlightMatch(suggestion, formState.color)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Chất lượng - Tùy chọn */}
          <div className="relative">
              <Label htmlFor="prodForm-quality" className="text-sm text-foreground">Chất lượng</Label>
              <Input 
                id="prodForm-quality" 
                type="text" 
                name="quality" 
                value={attributeSelection.quality ? formState.quality || '' : ''} 
                onChange={handleInputChange} 
                onFocus={() => {
                  if (attributeSelection.quality) {
                    if (formState.quality && formState.quality.trim()) {
                      // Hiển thị gợi ý dựa trên text hiện tại
                      const filtered = productQualityOptions
                        .filter(option => smartVietnameseMatch(formState.quality!.trim(), option))
                        .map(option => ({
                          option,
                          score: calculateRelevanceScore(formState.quality!.trim(), option)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);
                      
                      setFilteredQualitySuggestions(filtered.map(s => s.option));
                      setShowQualitySuggestions(filtered.length > 0);
                    } else {
                      // Hiển thị tất cả options có sẵn khi field trống
                      setFilteredQualitySuggestions(productQualityOptions.slice(0, 8));
                      setShowQualitySuggestions(productQualityOptions.length > 0);
                    }
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowQualitySuggestions(false), 200);
                }}
                disabled={!attributeSelection.quality}
                className={`w-full ${attributeSelection.quality ? 'bg-card' : 'bg-muted'}`}
                placeholder={attributeSelection.quality ? "Nhập hoặc chọn chất lượng" : "Bỏ qua chất lượng"}
                autoComplete="off"
              />
              {showQualitySuggestions && filteredQualitySuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {filteredQualitySuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border/30 last:border-b-0"
                      onClick={() => handleQualitySuggestionClick(suggestion)}
                    >
                      <div className="font-medium">
                        {highlightMatch(suggestion, formState.quality || '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Kích thước - Tùy chọn */}
          <div className="relative">
              <Label htmlFor="prodForm-size" className="text-sm text-foreground">Kích thước</Label>
              <Input 
                id="prodForm-size" 
                type="text" 
                name="size" 
                value={attributeSelection.size ? formState.size || '' : ''} 
                onChange={handleInputChange} 
                onFocus={() => {
                  if (attributeSelection.size) {
                    if (formState.size && formState.size.trim()) {
                      // Hiển thị gợi ý dựa trên text hiện tại
                      const filtered = sizeOptions
                        .filter(option => smartVietnameseMatch(formState.size!.trim(), option))
                        .map(option => ({
                          option,
                          score: calculateRelevanceScore(formState.size!.trim(), option)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);
                      
                      setFilteredSizeSuggestions(filtered.map(s => s.option));
                      setShowSizeSuggestions(filtered.length > 0);
                    } else {
                      // Hiển thị tất cả options có sẵn khi field trống
                      setFilteredSizeSuggestions(sizeOptions.slice(0, 8));
                      setShowSizeSuggestions(sizeOptions.length > 0);
                    }
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSizeSuggestions(false), 200);
                }}
                disabled={!attributeSelection.size}
                className={`w-full ${attributeSelection.size ? 'bg-card' : 'bg-muted'}`}
                placeholder={attributeSelection.size ? "Nhập hoặc chọn kích thước" : "Bỏ qua kích thước"}
                autoComplete="off"
              />
              {showSizeSuggestions && filteredSizeSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {filteredSizeSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border/30 last:border-b-0"
                      onClick={() => handleSizeSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">
                        {highlightMatch(suggestion, formState.size || '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Đơn vị - Tùy chọn */}
          <div className="relative">
              <Label htmlFor="prodForm-unit" className="text-sm text-foreground">Đơn vị</Label>
              <Input 
                id="prodForm-unit" 
                type="text" 
                name="unit" 
                value={attributeSelection.unit ? formState.unit || '' : ''} 
                onChange={handleInputChange} 
                onFocus={() => {
                  if (attributeSelection.unit) {
                    if (formState.unit && formState.unit.trim()) {
                      // Hiển thị gợi ý dựa trên text hiện tại
                      const filtered = unitOptions
                        .filter(option => smartVietnameseMatch(formState.unit!.trim(), option))
                        .map(option => ({
                          option,
                          score: calculateRelevanceScore(formState.unit!.trim(), option)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);
                      
                      setFilteredUnitSuggestions(filtered.map(s => s.option));
                      setShowUnitSuggestions(filtered.length > 0);
                    } else {
                      // Hiển thị tất cả options có sẵn khi field trống
                      setFilteredUnitSuggestions(unitOptions.slice(0, 8));
                      setShowUnitSuggestions(unitOptions.length > 0);
                    }
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowUnitSuggestions(false), 200);
                }}
                disabled={!attributeSelection.unit}
                className={`w-full ${attributeSelection.unit ? 'bg-card' : 'bg-muted'}`}
                placeholder={attributeSelection.unit ? "Nhập hoặc chọn đơn vị" : "Bỏ qua đơn vị"}
                autoComplete="off"
              />
              {showUnitSuggestions && filteredUnitSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto">
                  {filteredUnitSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm border-b border-border/30 last:border-b-0"
                      onClick={() => handleUnitSuggestionClick(suggestion)}
                    >
                      <div className="font-medium">
                        {highlightMatch(suggestion, formState.unit || '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Số lượng - Bắt buộc */}
          <div>
              <Label htmlFor="prodForm-quantity" className="text-sm text-foreground">Số lượng (*)</Label>
              <Input id="prodForm-quantity" type="number" name="quantity" value={formState.quantity} onChange={handleInputChange} required min="0" className="bg-card"/>
          </div>

          {/* Giá gốc - Bắt buộc */}
          <div>
              <Label htmlFor="prodForm-costPrice" className="text-sm text-foreground">Giá gốc (Nghìn VND) (*)</Label>
              <Input id="prodForm-costPrice" type="number" name="costPrice" value={formState.costPrice} onChange={handleInputChange} required min="0" step="any" className="bg-card"/>
          </div>

          {/* Giá bán - Bắt buộc */}
          <div>
              <Label htmlFor="prodForm-price" className="text-sm text-foreground">Giá bán (Nghìn VND) (*)</Label>
              <Input id="prodForm-price" type="number" name="price" value={formState.price} onChange={handleInputChange} required min="0" step="any" className="bg-card"/>
          </div>

          <div className="md:col-span-4 col-span-full">
              <Label className="text-sm text-foreground mb-3 block">Hình ảnh sản phẩm</Label>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
                folder="products"
                maxImages={10}
                currentImages={currentImages}
                className="mt-2"
              />
          </div>

          <div className="md:col-span-4">
            <Label htmlFor="prodForm-imageUrl" className="text-sm text-foreground">URL Hình ảnh đầu tiên</Label>
            <Input id="prodForm-imageUrl" type="text" value={formState.images[0] || ''} readOnly disabled className="bg-muted/50 mt-1"/>
          </div>

          </div>
        </form>
        <DialogFooter className="border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isFormInvalid}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
