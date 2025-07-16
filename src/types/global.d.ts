// Global type declarations for Ethereum wallet support
// This prevents TypeScript errors when accessing window.ethereum

declare global {
  interface Window {
    ethereum?: {
      selectedAddress?: string | null;
      isMetaMask?: boolean;
      isConnected?: () => boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      removeAllListeners?: (event?: string) => void;
      enable?: () => Promise<string[]>;
      send?: (method: string, params?: any[]) => Promise<any>;
      sendAsync?: (request: any, callback: (error: any, response: any) => void) => void;
      [key: string]: any;
    };
  }
}

export {};
