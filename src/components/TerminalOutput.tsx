

import React, { useRef, useEffect } from 'react';

interface TerminalOutputProps {
  history: string[];
  isProcessing: boolean;
}

const TerminalOutput = ({ history, isProcessing }: TerminalOutputProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const formatLine = (line: string, index: number) => {
    if (line.includes('Welcome') && line.includes('to Titan Terminal v1.0.0')) {
      return (
        <div key={index} className="mb-1">
          <span className="text-green-300 font-bold px-3 py-1 rounded border border-green-500/60 animate-pulse welcome-banner">
            {line}
          </span>
        </div>
      );
    }
    
    if (line.startsWith('$')) {
      return (
        <div key={index} className="mb-1">
          <span className="text-green-300">{line}</span>
        </div>
      );
    }
    
    // Check if line contains TITAN SECURITY SCAN header
    if (line.includes('[SCAN] TITAN Security Analysis')) {
      return (
        <div key={index} className="mb-2">
          <span className="text-green-400 font-bold text-sm">🛡️ {line}</span>
        </div>
      );
    }

    // Color coding for risk levels
    if (line.includes('[DANGER]')) {
      return (
        <div key={index} className="mb-1">
          <span className="text-red-400">⚠️ {line.replace('[DANGER]', 'DANGER:')}</span>
        </div>
      );
    }

    if (line.includes('[WARN]')) {
      return (
        <div key={index} className="mb-1">
          <span className="text-yellow-400">⚠️ {line.replace('[WARN]', 'WARN:')}</span>
        </div>
      );
    }

    if (line.includes('[ERROR]')) {
      return (
        <div key={index} className="mb-1">
          <span className="text-red-400">❌ {line.replace('[ERROR]', 'ERROR:')}</span>
        </div>
      );
    }
    
    return (
      <div key={index} className="mb-1">
        <span className="text-green-400/80 leading-relaxed">{line}</span>
      </div>
    );
  };

  return (
    <div 
      ref={terminalRef}
      className="flex-1 p-3 bg-black text-green-400 text-xs leading-relaxed overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-green-500/30"
    >
      <style>{`
        .welcome-banner {
          background: linear-gradient(90deg, 
            rgba(34, 197, 94, 0.2) 0%, 
            rgba(6, 182, 212, 0.3) 25%, 
            rgba(168, 85, 247, 0.2) 50%, 
            rgba(6, 182, 212, 0.3) 75%, 
            rgba(34, 197, 94, 0.2) 100%
          );
          background-size: 200% 100%;
          border: 1px solid rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          animation: shimmer 2s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      {history.map((line, index) => formatLine(line, index))}
      {isProcessing && (
        <div className="flex items-center gap-2 text-green-300">
          <span>Processing</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalOutput;

