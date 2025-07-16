"use client";

import { useEffect } from 'react';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      selectedAddress?: string | null;
      isMetaMask?: boolean;
      isConnected?: () => boolean;
      request?: (args: any) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      removeAllListeners?: (event?: string) => void;
      [key: string]: any;
    };
  }
}

/**
 * Component to prevent Ethereum wallet errors on mobile devices
 * This fixes the "window.ethereum.selectedAddress = undefined" error
 * that occurs on mobile browsers where MetaMask is not available
 */
export function MobileEthereumFix() {
  useEffect(() => {
    // Only run this fix on mobile devices or when window.ethereum is not available
    if (typeof window !== 'undefined') {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // If ethereum is not available or we're on mobile, create a stub
      if (!window.ethereum || isMobile) {
        // Create a minimal ethereum object to prevent errors
        window.ethereum = {
          selectedAddress: null,
          isMetaMask: false,
          isConnected: () => false,
          request: () => Promise.reject(new Error('No Ethereum provider available on mobile')),
          on: () => {},
          removeListener: () => {},
          removeAllListeners: () => {},
          ...(window.ethereum || {}) // Preserve any existing properties
        };
        
        console.log('Mobile Ethereum fix applied - created stub ethereum object');
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
