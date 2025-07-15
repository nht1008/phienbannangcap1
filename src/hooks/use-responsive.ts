"use client";

import { useState, useEffect } from 'react';

// Tailwind CSS breakpoints
const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type BreakpointKey = keyof typeof breakpoints;

interface UseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isAbove: (bp: BreakpointKey) => boolean;
  isBelow: (bp: BreakpointKey) => boolean;
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [isTouch, setIsTouch] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(1);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPixelRatio(window.devicePixelRatio || 1);
    };

    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    updateDimensions();
    checkTouch();

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  const { width, height } = dimensions;

  // Determine current breakpoint
  const getCurrentBreakpoint = (): BreakpointKey => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  const isAbove = (bp: BreakpointKey): boolean => {
    return width >= breakpoints[bp];
  };

  const isBelow = (bp: BreakpointKey): boolean => {
    return width < breakpoints[bp];
  };

  const isBetween = (min: BreakpointKey, max: BreakpointKey): boolean => {
    return width >= breakpoints[min] && width < breakpoints[max];
  };

  return {
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isLarge: width >= breakpoints.xl,
    width,
    height,
    breakpoint: getCurrentBreakpoint(),
    isAbove,
    isBelow,
    isBetween,
    orientation: width > height ? 'landscape' : 'portrait',
    isTouch,
    pixelRatio,
  };
}

// Hook để detect specific device characteristics
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    
    setDeviceInfo({
      userAgent: ua,
      isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
      isDesktop: !/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isAndroid: /Android/i.test(ua),
      isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
      isChrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
      isFirefox: /Firefox/i.test(ua),
      isEdge: /Edge/i.test(ua),
    });
  }, []);

  return deviceInfo;
}

// Hook để monitor performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0, // Cumulative Layout Shift
    ttfb: 0, // Time to First Byte
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            break;
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
          case 'first-input':
            // @ts-ignore
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            break;
          case 'layout-shift':
            // @ts-ignore
            if (!entry.hadRecentInput) {
              // @ts-ignore
              setMetrics(prev => ({ ...prev, cls: prev.cls + entry.value }));
            }
            break;
          case 'navigation':
            // @ts-ignore
            setMetrics(prev => ({ ...prev, ttfb: entry.responseStart - entry.requestStart }));
            break;
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
    } catch (e) {
      console.warn('Performance Observer not supported:', e);
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// Hook để test responsive breakpoints
export function useBreakpointTest() {
  const responsive = useResponsive();
  
  const testBreakpoint = (targetBreakpoint: BreakpointKey): {
    passed: boolean;
    currentBreakpoint: BreakpointKey;
    message: string;
  } => {
    const passed = responsive.breakpoint === targetBreakpoint;
    const message = passed 
      ? `✅ Breakpoint ${targetBreakpoint} test passed`
      : `❌ Expected ${targetBreakpoint}, got ${responsive.breakpoint}`;
    
    return {
      passed,
      currentBreakpoint: responsive.breakpoint,
      message,
    };
  };

  const testResponsiveRange = (min: BreakpointKey, max: BreakpointKey): {
    passed: boolean;
    inRange: boolean;
    message: string;
  } => {
    const inRange = responsive.isBetween(min, max);
    const passed = inRange;
    const message = passed 
      ? `✅ Responsive range ${min}-${max} test passed`
      : `❌ Not in range ${min}-${max}, current: ${responsive.breakpoint}`;
    
    return {
      passed,
      inRange,
      message,
    };
  };

  const testTouchTargets = (): {
    passed: boolean;
    message: string;
    details: string[];
  } => {
    const details: string[] = [];
    let passed = true;

    if (responsive.isMobile) {
      // Check for minimum touch target size (44px)
      const buttons = document.querySelectorAll('button, a, input, select');
      buttons.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const minSize = Math.min(rect.width, rect.height);
        
        if (minSize < 44 && index < 10) { // Check first 10 elements
          passed = false;
          details.push(`Element ${index + 1}: ${minSize.toFixed(1)}px (minimum: 44px)`);
        }
      });
    }

    const message = passed 
      ? '✅ Touch target test passed'
      : `❌ Touch target test failed: ${details.length} elements below minimum size`;

    return { passed, message, details };
  };

  return {
    ...responsive,
    testBreakpoint,
    testResponsiveRange,
    testTouchTargets,
  };
}
