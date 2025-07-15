"use client";

import { useEffect, useState } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;
      
      // Samsung Galaxy S8+ specific detection
      const isSamsungGalaxyS8Plus = (
        (width === 360 && height === 740) || // Portrait
        (width === 740 && height === 360) || // Landscape
        userAgent.includes('SM-G955') || // Galaxy S8+
        userAgent.includes('SM-G950') // Galaxy S8
      );
      
      // General mobile detection
      const isMobileDevice = width <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        isSamsungGalaxyS8Plus;
      
      const isTabletDevice = width > 768 && width <= 1024;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      
      // Add classes to body for CSS targeting
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
        document.body.classList.remove('desktop-device', 'tablet-device');
      } else if (isTabletDevice) {
        document.body.classList.add('tablet-device');
        document.body.classList.remove('mobile-device', 'desktop-device');
      } else {
        document.body.classList.add('desktop-device');
        document.body.classList.remove('mobile-device', 'tablet-device');
      }
      
      if (isSamsungGalaxyS8Plus) {
        document.body.classList.add('samsung-galaxy-s8');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return { isMobile, isTablet };
}

export function MobileDetectionProvider({ children }: { children: React.ReactNode }) {
  useMobileDetection();
  return <>{children}</>;
}
