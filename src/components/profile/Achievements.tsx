
import React, { useState } from 'react';
import { Award, Check } from 'lucide-react';

const Achievements = () => {
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // No achievements unlocked by default
  const achievements: any[] = [];

  const allAchievements = [
    { name: 'First Transaction', description: 'Complete your first crypto transaction', unlocked: false },
    { name: 'Crypto Explorer', description: 'Explore 5 different cryptocurrencies', unlocked: false },
    { name: 'Dark Mode Lover', description: 'Use dark mode for 7 days straight', unlocked: false },
    { name: 'Whale Spotter', description: 'Track a transaction over $1M', unlocked: false },
    { name: 'NFT Collector', description: 'Own 10 or more NFTs', unlocked: false },
    { name: 'DeFi Master', description: 'Use 5 different DeFi protocols', unlocked: false },
    { name: 'Portfolio Builder', description: 'Maintain a portfolio over $50k for 30 days', unlocked: false },
    { name: 'Speed Trader', description: 'Execute 100 trades in a single day', unlocked: false },
    { name: 'Diamond Hands', description: 'Hold a position for over 1 year', unlocked: false },
    { name: 'Network Pioneer', description: 'Use a new blockchain within 24h of launch', unlocked: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
          <Award className="w-4 h-4" />
          Achievements
        </div>
        <button
          onClick={() => setShowAllAchievements(!showAllAchievements)}
          className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-xs hover:bg-green-500/30 transition-colors"
        >
          <Check className="w-3 h-3" />
          Check All
        </button>
      </div>

      {showAllAchievements && (
        <div className="mb-3 p-3 bg-gray-900/70 border border-green-500/30 rounded">
          <div className="text-green-400 text-xs font-semibold mb-2">All Available Achievements:</div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(34, 197, 94, 0.3) rgba(17, 24, 39, 1)'
          }}>
            {allAchievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-black/30 rounded border border-green-500/10">
                <div className={`w-2 h-2 rounded-full mt-1 ${achievement.unlocked ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                <div className="flex-1">
                  <div className={`text-xs font-medium ${achievement.unlocked ? 'text-green-400' : 'text-gray-400'}`}>
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-500">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 ? (
        <div className="bg-gray-900/50 border border-green-500/20 rounded p-3">
          <div className="text-green-400/50 text-xs text-center">No achievements unlocked yet</div>
        </div>
      ) : (
        <div className="space-y-2">
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            return (
              <div key={index} className="bg-gray-900/50 border border-green-500/20 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-xs">{achievement.name}</span>
                  </div>
                  <span className="text-green-400/70 text-xs">{achievement.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Achievements;
