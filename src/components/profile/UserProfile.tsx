import React, { useState } from 'react';
import { User, Crown, Shield, Zap } from 'lucide-react';

interface UserProfileProps {
  userUID: string;
  userNickname: string;
}

const UserProfile = ({ userUID, userNickname }: UserProfileProps) => {
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);

  const handleBetaTrial = async () => {
    try {
      // Проверяем если есть глобальная функция из popup.js (для прямого user gesture)
      if (typeof window !== 'undefined' && (window as any).handleBetaTrial) {
        (window as any).handleBetaTrial();
        setShowUpgradeMenu(false);
        return;
      }
      
      // Fallback для случаев когда popup.js не загружен
      if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
        const response = await (window as any).chrome.runtime.sendMessage({ action: 'downloadDocs' });
        if (response.success) {
          console.log('Beta trial documentation download started...');
        } else {
          console.error('Beta trial error:', response.error);
        }
      }
    } catch (error) {
      console.error('Beta trial error:', error);
    }
    setShowUpgradeMenu(false);
  };

  return (
    <div className="bg-gray-900/50 border border-green-500/20 rounded p-3">
      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
        <User className="w-4 h-4" />
        User Profile
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-green-400/70 text-xs">UID:</span>
          <span className="text-green-400 text-xs font-mono">{userUID}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-400/70 text-xs">Nickname:</span>
          <span className="text-green-300 text-xs">{userNickname}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-400/70 text-xs">Role:</span>
          <div className="relative">
            <button 
              onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-green-500/20 rounded text-green-400 text-xs hover:bg-green-500/20 hover:border-green-500/40 transition-all duration-200"
            >
              <Shield className="w-3 h-3" />
              User
            </button>
            
            {showUpgradeMenu && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-gray-900/95 border border-green-500/30 rounded p-3 z-50 backdrop-blur-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    Upgrade to Dark Elite
                  </div>
                  
                  <div className="text-green-400/80 text-xs">
                    Unlock premium features and advanced neural capabilities
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-green-400 text-xs font-medium">Requirements:</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span className="text-green-400/70">Complete 10 transactions</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span className="text-green-400/70">Hold portfolio for 30 days</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        <span className="text-green-400/70">Use neural core 100 times</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-green-500/20 pt-2">
                    <div className="text-green-400/60 text-xs mb-2">Alternative:</div>
                    <button 
                      onClick={handleBetaTrial}
                      className="w-full relative group overflow-hidden bg-gray-800/90 border border-green-500/50 text-green-400 font-mono text-xs py-2 px-3 rounded transition-all duration-300 hover:border-green-400 hover:text-green-300 hover:bg-gray-800/70 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center gap-2">
                        <Zap className="w-3 h-3 group-hover:animate-pulse" />
                        <span className="tracking-wide">TRY_BETA_TRIAL</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close upgrade menu */}
      {showUpgradeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUpgradeMenu(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;
