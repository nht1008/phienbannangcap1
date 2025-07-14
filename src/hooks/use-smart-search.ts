"use client";

import { useState, useMemo } from 'react';
import { normalizeStringForSearch } from '@/lib/utils';

export interface SearchField<T> {
  key: keyof T | string;
  weight?: number; // Trọng số cho tìm kiếm (càng cao càng quan trọng)
  transform?: (item: T) => string; // Hàm transform dữ liệu trước khi tìm kiếm
}

export interface UseSmartSearchOptions<T> {
  searchFields: SearchField<T>[];
  threshold?: number; // Ngưỡng điểm để hiển thị kết quả (0-1)
  fuzzySearch?: boolean; // Có sử dụng tìm kiếm mờ không
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[]; // Các trường đã match
}

export function useSmartSearch<T>(
  data: T[],
  options: UseSmartSearchOptions<T>
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.map(item => ({ item, score: 1, matches: [] }));
    }

    const normalizedQuery = normalizeStringForSearch(searchQuery);
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
    
    if (queryWords.length === 0) {
      return data.map(item => ({ item, score: 1, matches: [] }));
    }

    const results: SearchResult<T>[] = [];

    for (const item of data) {
      let totalScore = 0;
      let maxPossibleScore = 0;
      const matches: string[] = [];

      for (const field of options.searchFields) {
        const weight = field.weight || 1;
        maxPossibleScore += weight;

        let fieldValue: string;
        
        if (field.transform) {
          fieldValue = field.transform(item);
        } else if (typeof field.key === 'string' && field.key.includes('.')) {
          // Support for nested properties
          const keys = field.key.split('.');
          let value: any = item;
          for (const key of keys) {
            value = value?.[key];
          }
          fieldValue = String(value || '');
        } else {
          fieldValue = String((item as any)[field.key] || '');
        }

        const normalizedFieldValue = normalizeStringForSearch(fieldValue);
        let fieldScore = 0;

        // Tìm kiếm chính xác
        if (normalizedFieldValue.includes(normalizedQuery)) {
          fieldScore = weight;
          matches.push(String(field.key));
        } else {
          // Tìm kiếm từng từ
          let wordMatches = 0;
          for (const word of queryWords) {
            if (normalizedFieldValue.includes(word)) {
              wordMatches++;
            }
          }
          fieldScore = (wordMatches / queryWords.length) * weight;
          
          if (wordMatches > 0) {
            matches.push(String(field.key));
          }
        }

        // Tìm kiếm mờ (fuzzy search) nếu bật
        if (options.fuzzySearch && fieldScore === 0) {
          const fuzzyScore = calculateFuzzyScore(normalizedQuery, normalizedFieldValue);
          if (fuzzyScore > 0.6) { // Ngưỡng cho fuzzy search
            fieldScore = fuzzyScore * weight * 0.5; // Giảm trọng số cho fuzzy match
            matches.push(String(field.key));
          }
        }

        totalScore += fieldScore;
      }

      const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
      const threshold = options.threshold || 0.1;

      if (normalizedScore >= threshold) {
        results.push({
          item,
          score: normalizedScore,
          matches: [...new Set(matches)] // Remove duplicates
        });
      }
    }

    // Sắp xếp theo điểm số giảm dần
    return results.sort((a, b) => b.score - a.score);
  }, [data, searchQuery, options]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Không cần timeout và setIsSearching để tránh hiệu ứng nháy
  };

  return {
    searchQuery,
    setSearchQuery: setSearchQuery, // Direct setter without UX delay
    setSearchQueryWithDelay: handleSearch, // Method with potential UX enhancements
    clearSearch,
    filteredResults,
    isSearching,
    hasResults: filteredResults.length > 0,
    totalResults: filteredResults.length
  };
}

// Hàm tính điểm tương tự mờ (fuzzy matching)
function calculateFuzzyScore(query: string, target: string): number {
  if (query === target) return 1;
  if (query.length === 0 || target.length === 0) return 0;

  // Levenshtein distance algorithm
  const matrix: number[][] = [];
  
  for (let i = 0; i <= target.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= query.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= query.length; j++) {
      if (target.charAt(i - 1) === query.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[target.length][query.length];
  const maxLength = Math.max(query.length, target.length);
  
  return 1 - (distance / maxLength);
}

// Hook chuyên dụng cho từng loại data
export function useDebtSearch(debts: any[]) {
  return useSmartSearch(debts, {
    searchFields: [
      { key: 'customerName', weight: 3 },
      { key: 'status', weight: 2 },
      { 
        key: 'remainingAmount', 
        weight: 1,
        transform: (debt) => debt.remainingAmount.toLocaleString('vi-VN')
      },
      { 
        key: 'date', 
        weight: 1,
        transform: (debt) => {
          const date = new Date(debt.date);
          return date.toLocaleDateString('vi-VN');
        }
      }
    ],
    threshold: 0.1,
    fuzzySearch: true
  });
}

export function useCustomerSearch(customers: any[]) {
  return useSmartSearch(customers, {
    searchFields: [
      { key: 'name', weight: 3 },
      { key: 'phone', weight: 2 },
      { key: 'email', weight: 2 },
      { key: 'address', weight: 1 },
      { key: 'zaloName', weight: 2 },
      { key: 'tier', weight: 1 }
    ],
    threshold: 0.1,
    fuzzySearch: true
  });
}

export function useInvoiceSearch(invoices: any[]) {
  return useSmartSearch(invoices, {
    searchFields: [
      { key: 'customerName', weight: 3 },
      { key: 'id', weight: 2 },
      { key: 'paymentMethod', weight: 1 },
      { key: 'employeeName', weight: 2 },
      { 
        key: 'total', 
        weight: 1,
        transform: (invoice) => invoice.total.toLocaleString('vi-VN')
      },
      { 
        key: 'date', 
        weight: 1,
        transform: (invoice) => {
          const date = new Date(invoice.date);
          return date.toLocaleDateString('vi-VN');
        }
      },
      {
        key: 'items',
        weight: 1,
        transform: (invoice) => invoice.items.map((item: any) => item.name).join(' ')
      }
    ],
    threshold: 0.1,
    fuzzySearch: true
  });
}
