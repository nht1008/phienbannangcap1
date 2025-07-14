"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  X, 
  Filter, 
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface SmartSearchBarProps {
  placeholder?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isSearching?: boolean;
  totalResults?: number;
  suggestions?: string[];
  showFilters?: boolean;
  filters?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export function SmartSearchBar({
  placeholder = "Tìm kiếm thông minh...",
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
  totalResults,
  suggestions = [],
  showFilters = false,
  filters,
  className,
  variant = 'default'
}: SmartSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange(value);
    setShowSuggestions(value.length > 0);
  };

  const handleClear = () => {
    setLocalSearchQuery('');
    onClearSearch();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
  };

  const hasResults = totalResults !== undefined;
  const isCompact = variant === 'compact';

  return (
    <div className={cn("relative w-full", className)}>
      <div className={cn(
        "relative flex items-center gap-2",
        isCompact ? "space-x-1" : "space-x-2"
      )}>
        {/* Main search input */}
        <div className="relative flex-1">
          <div className={cn(
            "relative flex items-center",
            "border rounded-lg transition-all duration-200",
            isFocused 
              ? "ring-2 ring-ring ring-offset-2 border-primary" 
              : "border-input hover:border-primary/50",
            isCompact ? "h-9" : "h-11"
          )}>
            <Search className={cn(
              "absolute left-3 text-muted-foreground",
              isSearching && "animate-pulse",
              isCompact ? "h-4 w-4" : "h-5 w-5"
            )} />
            
            <Input
              value={localSearchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                if (localSearchQuery.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setIsFocused(false);
                // Delay hiding suggestions to allow clicks
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={placeholder}
              className={cn(
                "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                isCompact ? "pl-9 pr-20 h-9 text-sm" : "pl-11 pr-24 h-11"
              )}
            />

            {/* Clear button and result count */}
            <div className="absolute right-2 flex items-center gap-1">
              {hasResults && searchQuery && (
                <Badge variant="secondary" className={cn(
                  "text-xs font-medium",
                  isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
                )}>
                  {totalResults}
                </Badge>
              )}
              
              {localSearchQuery && (
                <Button
                  variant="ghost"
                  size={isCompact ? "sm" : "default"}
                  onClick={handleClear}
                  className={cn(
                    "hover:bg-transparent p-0",
                    isCompact ? "h-6 w-6" : "h-8 w-8"
                  )}
                >
                  <X className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isCompact ? "h-3 w-3" : "h-4 w-4"
                  )} />
                </Button>
              )}
            </div>
          </div>

          {/* Search suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (isFocused || localSearchQuery.length > 0) && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg">
              <CardContent className="p-0">
                {/* Current search results info */}
                {searchQuery && hasResults && (
                  <div className="p-3 border-b bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tìm thấy <span className="font-medium text-foreground">{totalResults}</span> kết quả
                      </span>
                      {isSearching && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Đang tìm...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div className="p-2">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Gợi ý tìm kiếm
                  </Label>
                  <div className="space-y-1">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors"
                      >
                        <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filter button */}
        {showFilters && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size={isCompact ? "sm" : "default"}
                className={cn(
                  "shrink-0",
                  isCompact ? "h-9 px-2" : "h-11 px-3"
                )}
              >
                <Filter className={cn(
                  isCompact ? "h-3 w-3" : "h-4 w-4"
                )} />
                {!isCompact && <span className="ml-1">Lọc</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Bộ lọc tìm kiếm</h4>
                {filters}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Search tips */}
      {!isCompact && !searchQuery && !isFocused && (
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Mẹo: Bạn có thể tìm kiếm theo tên, số điện thoại, địa chỉ hoặc bất kỳ thông tin nào
        </div>
      )}
    </div>
  );
}

// Component for search result highlights
export function SearchHighlight({ 
  text, 
  searchQuery, 
  className 
}: { 
  text: string; 
  searchQuery: string; 
  className?: string; 
}) {
  if (!searchQuery) return <span className={className}>{text}</span>;

  const normalizedText = text.toLowerCase();
  const normalizedQuery = searchQuery.toLowerCase();
  
  if (!normalizedText.includes(normalizedQuery)) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.toLowerCase() === normalizedQuery ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
