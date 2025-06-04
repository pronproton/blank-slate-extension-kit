
import { useEffect, useState } from 'react';

interface AuthCheckProps {
  children: React.ReactNode;
}

interface ChromeResponse {
  isLoggedIn?: boolean;
}

// Declare global chrome types for extension environment
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: any, callback: (response: any) => void) => void;
        getURL: (path: string) => string;
      };
    };
  }
}

const AuthCheck = ({ children }: AuthCheckProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
          const response = await new Promise<ChromeResponse>((resolve) => {
            window.chrome!.runtime!.sendMessage({ action: 'getUserData' }, resolve);
          });
          
          if (response && response.isLoggedIn) {
            setIsAuthenticated(true);
          } else {
            // Redirect to welcome page
            window.location.href = window.chrome.runtime.getURL('welcome.html');
          }
        } else {
          // Not in extension environment, allow access
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Auth check failed, allowing access');
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400">
        <div className="text-center">
          <div className="text-lg font-mono">Initializing System...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;
