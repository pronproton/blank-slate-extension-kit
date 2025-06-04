
import React from 'react';
import { Terminal, Activity } from 'lucide-react';

const TerminalHeader = () => {
  return (
    <div className="bg-gradient-to-r from-black to-gray-900 border-b border-green-500/30 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-green-400" />
        <span className="text-green-400 font-semibold text-sm">Titan Terminal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <Activity className="w-4 h-4 text-green-400" />
      </div>
    </div>
  );
};

export default TerminalHeader;
