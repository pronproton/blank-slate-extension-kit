
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Globe, Zap, Shield } from 'lucide-react';

interface PageInfo {
  title: string;
  url: string;
  timestamp: string;
}

const ExtensionPopup = () => {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Get current tab information
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id!, { action: 'getPageInfo' }, (response) => {
            if (response) {
              setPageInfo(response);
            }
          });
        }
      });
    } else {
      // Fallback for development
      setPageInfo({
        title: 'Development Mode',
        url: 'http://localhost:8080',
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const handleToggle = () => {
    setIsActive(!isActive);
    // You can add logic here to enable/disable extension functionality
  };

  const handleSettings = () => {
    // Open options page or settings
    console.log('Opening settings...');
  };

  return (
    <div className="w-80 p-4 bg-gradient-to-br from-slate-50 to-slate-100 min-h-[400px]">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              My Extension
            </CardTitle>
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Page Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Current Page
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-slate-800 truncate">
                {pageInfo?.title || 'Loading...'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {pageInfo?.url || 'Loading...'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Controls */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Controls
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={handleToggle}
                className="text-xs"
              >
                {isActive ? 'Disable' : 'Enable'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettings}
                className="text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-800">42</p>
              <p className="text-xs text-slate-500">Actions</p>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-800">7</p>
              <p className="text-xs text-slate-500">Sites</p>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-800">99%</p>
              <p className="text-xs text-slate-500">Uptime</p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400">
              Last updated: {pageInfo?.timestamp ? new Date(pageInfo.timestamp).toLocaleTimeString() : '--:--'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionPopup;
