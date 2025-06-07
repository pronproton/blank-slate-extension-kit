
// Global Chrome API types for extension environment
declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: {
          get: (keys: string | string[]) => Promise<any>;
        };
      };
      downloads?: {
        download: (options: any, callback: (downloadId: number) => void) => void;
        onChanged: {
          addListener: (callback: (delta: any) => void) => void;
          removeListener: (callback: (delta: any) => void) => void;
        };
        open: (downloadId: number) => void;
        removeFile: (downloadId: number, callback: () => void) => void;
        erase: (query: { id: number }, callback: () => void) => void;
      };
      runtime?: {
        sendMessage: (message: any, callback: (response: any) => void) => void;
        getURL: (path: string) => string;
        lastError?: { message: string };
      };
    };
  }
}

export {};
