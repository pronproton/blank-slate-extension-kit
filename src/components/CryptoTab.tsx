
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CryptoTab = () => {
  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: '$43,250.00', change: '+2.45%', isUp: true },
    { symbol: 'ETH', name: 'Ethereum', price: '$2,680.50', change: '+1.82%', isUp: true },
    { symbol: 'SOL', name: 'Solana', price: '$98.75', change: '-0.65%', isUp: false },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="text-green-400 text-sm font-semibold mb-3">Live Crypto Prices</div>
      {cryptoData.map((crypto) => (
        <div key={crypto.symbol} className="bg-gray-900/50 border border-green-500/20 rounded p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-semibold text-sm">{crypto.symbol}</span>
              <span className="text-green-400/70 text-xs">{crypto.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {crypto.isUp ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${crypto.isUp ? 'text-green-400' : 'text-red-400'}`}>
                {crypto.change}
              </span>
            </div>
          </div>
          <div className="text-green-300 font-mono text-sm">{crypto.price}</div>
        </div>
      ))}
      <div className="mt-4 p-2 bg-green-500/10 border border-green-500/30 rounded">
        <div className="text-green-400 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full inline-block mr-2 animate-pulse"></div>
          Real-time data feed active
        </div>
      </div>
    </div>
  );
};

export default CryptoTab;
