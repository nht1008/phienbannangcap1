"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Banner } from '@/types';
import { BannerManagerDialog } from './BannerManagerDialog';
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useSidebar } from '../ui/sidebar';

interface HeroBannerProps {
  hasFullAccessRights: boolean;
}

export function HeroBanner({ hasFullAccessRights }: HeroBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { toast } = useToast();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()])
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, banners]);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cloudinary-banners');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setBanners(data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({ title: "Error", description: "Could not fetch banners.", variant: "destructive" });
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleBannersChange = (updatedBanners: Banner[]) => {
    setBanners(updatedBanners);
  };

  return (
    <>
      <div className={cn(
        "relative w-screen bg-gray-700 group transition-all duration-200 ease-linear",
        hasFullAccessRights ? "h-[60vh]" : "h-[60vh]",
        sidebarState === 'expanded' ? 'lg:-ml-[16rem]' : 'lg:-ml-[3rem]'
      )}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden" ref={emblaRef}>
            <div className="flex h-full">
                {isLoading ? (
                    <div className="flex-shrink-0 w-full h-full bg-gray-600 animate-pulse" />
                ) : banners.length > 0 ? (
                    banners.map((banner, index) => (
                        <div key={banner.id} className="flex-shrink-0 w-full h-full relative">
                            <Image
                                src={banner.url}
                                alt={`Banner ${index + 1}`}
                                fill
                                priority={index === 0}
                                sizes="100vw"
                                className="object-cover"
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex-shrink-0 w-full h-full relative">
                        <Image
                            src="https://images.unsplash.com/photo-1599229021856-afdd98224c23?q=80&w=2070&auto=format&fit=crop"
                            alt="Fallback banner image"
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                    </div>
                )}
            </div>
        </div>

        {hasFullAccessRights && (
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsManagerOpen(true)}
              className="bg-white/80 hover:bg-white text-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        )}

      </div>

      {hasFullAccessRights && (
        <BannerManagerDialog
          isOpen={isManagerOpen}
          onClose={() => setIsManagerOpen(false)}
          banners={banners}
          onBannersChange={handleBannersChange}
        />
      )}
    </>
  );
}