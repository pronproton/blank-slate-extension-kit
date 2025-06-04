
import React from 'react';

const StatusBar = () => {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-black border-t border-green-500/20 px-3 py-1 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-bold text-green-300 animate-pulse">Online</span>
      </div>
      <div className="text-green-400/50">
        Neural AI Ready
      </div>
    </div>
  );
};

export default StatusBar;
