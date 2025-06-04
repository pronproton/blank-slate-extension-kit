
import React from 'react';
import { Zap, ChevronDown } from 'lucide-react';

interface NeuralCoreProps {
  isProcessing: boolean;
  showCoreMenu: boolean;
  onToggleMenu: () => void;
}

const NeuralCore = ({ isProcessing, showCoreMenu, onToggleMenu }: NeuralCoreProps) => {
  return (
    <div className="bg-gray-900/50 border-b border-green-500/20 p-2 relative">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-green-400">
          <Zap className="w-3 h-3" />
          <button 
            onClick={onToggleMenu}
            className="flex items-center gap-1 hover:text-green-300 transition-colors"
          >
            <span>Neural Core</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-3 bg-green-400 rounded-sm ${
                isProcessing ? 'animate-pulse' : ''
              }`}
              style={{
                opacity: Math.random() * 0.7 + 0.3,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
      
      {showCoreMenu && (
        <div className="absolute top-full left-2 mt-1 bg-gray-900 border border-green-500/30 rounded p-2 z-10">
          <div className="space-y-1">
            <button className="block w-full text-left text-xs text-green-400/50 hover:text-green-400/70 transition-colors cursor-not-allowed">
              Dark Core (Locked)
            </button>
            <button className="block w-full text-left text-xs text-green-400/50 hover:text-green-400/70 transition-colors cursor-not-allowed">
              Light Core (Locked)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuralCore;
