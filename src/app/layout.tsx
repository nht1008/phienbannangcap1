console.log("DEBUG: layout.tsx - File is being processed by Next.js"); // LOG RẤT SỚM

import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { MobileDetectionProvider } from '@/hooks/useMobileDetection';
import { MobileEthereumFix } from '@/components/utils/MobileEthereumFix';

export const metadata: Metadata = {
  title: 'Cửa Hàng Hoa Công Nguyệt',
  description: 'Flower Shop Management App',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// This component acts as a boundary to prevent Next.js's internal props
// from leaking down the component tree, which can cause issues with some libraries.
const CleanChildren = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function RootLayout({
  children,
  params,
  searchParams,
}: Readonly<{
  children: React.ReactNode;
  params: { [key: string]: string | string[] };
  searchParams: { [key: string]: string | string[] | undefined };
}>) {
  // The presence of params and searchParams in the function signature
  // is enough to opt the page into dynamic rendering.
  // We don't need to (and shouldn't) call React.use() on them.
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        {/* Prevent Ethereum wallet errors on mobile devices */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (!window.ethereum || isMobile) {
                  try {
                    window.ethereum = {
                      selectedAddress: null,
                      isMetaMask: false,
                      isConnected: function() { return false; },
                      request: function() { return Promise.reject(new Error('No Ethereum provider available on mobile')); },
                      on: function() {},
                      removeListener: function() {},
                      removeAllListeners: function() {}
                    };
                    console.log('Mobile Ethereum fix applied');
                  } catch (e) {
                    console.log('Ethereum fix error:', e);
                  }
                }
              }
            })();
          `
        }} />
      </head>
      <body className="font-body antialiased">
        <MobileEthereumFix />
        <AuthProvider>
          <MobileDetectionProvider>
            <CleanChildren>{children}</CleanChildren>
            <Toaster />
          </MobileDetectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
