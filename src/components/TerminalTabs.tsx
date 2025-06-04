
import React from 'react';
import { Terminal, User, Settings, LayoutDashboard } from 'lucide-react';

interface TerminalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TerminalTabs = ({ activeTab, onTabChange }: TerminalTabsProps) => {
  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="border-b border-green-500/30 bg-gray-900/50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-500/20 text-green-400 border-b border-green-400'
                  : 'text-green-400/70 hover:text-green-400 hover:bg-green-500/10'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TerminalTabs;
