"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SmartSearchBarProps {
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
}

interface SearchHighlightProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function SearchHighlight({ text, searchQuery, className }: SearchHighlightProps) {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Normalize search query and text for better matching
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(searchQuery);

  const index = normalizedText.indexOf(normalizedQuery);
  
  if (index === -1) {
    return <span className={className}>{text}</span>;
  }

  // Find the actual position in the original text
  const beforeMatch = text.slice(0, index);
  const match = text.slice(index, index + searchQuery.length);
  const afterMatch = text.slice(index + searchQuery.length);

  return (
    <span className={className}>
      {beforeMatch}
      <mark className="bg-yellow-200 dark:bg-yellow-800 font-medium">
        {match}
      </mark>
      {afterMatch}
    </span>
  );
}

export function SmartSearchBar({
  placeholder = "Tìm kiếm...",
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching = false,
  totalResults,
  suggestions = [],
  showFilters = false,
  filters,
  className
}: SmartSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    if (value.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !searchQuery) {
      setShowSuggestions(true);
    }
  };

  const handleClear = () => {
    onClearSearch();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSuggestionsSection = filteredSuggestions.length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            className={cn(
              "pl-10 pr-16",
              showFilters && "pr-20"
            )}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {showFilters && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium">Bộ lọc tìm kiếm</h4>
                    {filters}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1">
            <div className="bg-background border rounded-md p-2 shadow-md">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                Đang tìm kiếm...
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {totalResults !== undefined && !isSearching && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1">
            <div className="bg-background border rounded-md p-2 shadow-md">
              <div className="text-sm text-muted-foreground">
                Tìm thấy {totalResults} kết quả
              </div>
            </div>
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && showSuggestionsSection && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Gợi ý
              </div>
              <div className="space-y-1">
                {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <SearchHighlight 
                      text={suggestion} 
                      searchQuery={searchQuery}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active search indicator */}
      {searchQuery && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            Tìm kiếm: "{searchQuery}"
            <button
              onClick={handleClear}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}
