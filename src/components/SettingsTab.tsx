
import React, { useState } from 'react';
import { Volume2, Bell, Zap, Shield } from 'lucide-react';
import { Slider } from './ui/slider';

interface SettingsTabProps {
  soundEnabled?: boolean;
  onSoundChange?: (enabled: boolean) => void;
  soundVolume?: number;
  onVolumeChange?: (volume: number) => void;
}

const SettingsTab = ({ 
  soundEnabled = true, 
  onSoundChange, 
  soundVolume = 50,
  onVolumeChange 
}: SettingsTabProps) => {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [secureMode, setSecureMode] = useState(false);

  const ToggleSwitch = ({ enabled, onChange, label, icon: Icon }: any) => (
    <div className="bg-gray-900/50 border border-green-500/20 rounded p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">{label}</span>
        </div>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative w-5 h-5 rounded border transition-all duration-300 ease-in-out transform hover:scale-105 ${
            enabled 
              ? 'bg-green-500/30 border-green-500 shadow-md shadow-green-500/20' 
              : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
          }`}
        >
          <div
            className={`absolute inset-0.5 rounded transition-all duration-300 ease-in-out ${
              enabled 
                ? 'bg-green-400 shadow-sm shadow-green-400/30 scale-100 opacity-100' 
                : 'bg-transparent scale-75 opacity-0'
            }`}
          />
          {enabled && (
            <div className="absolute inset-0 bg-green-400/10 rounded animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-3 space-y-3">
      <div className="text-green-400 text-sm font-semibold mb-3">Chat Settings</div>
      
      <ToggleSwitch
        enabled={soundEnabled}
        onChange={onSoundChange}
        label="Sound Effects"
        icon={Volume2}
      />
      
      {soundEnabled && (
        <div className="bg-gray-900/50 border border-green-500/20 rounded p-3 ml-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400/80 text-xs">Volume</span>
            <span className="text-green-400 text-xs">{soundVolume}%</span>
          </div>
          <Slider
            value={[soundVolume]}
            onValueChange={(value) => onVolumeChange?.(value[0])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
      )}
      
      <ToggleSwitch
        enabled={notifications}
        onChange={setNotifications}
        label="Notifications"
        icon={Bell}
      />
      
      <ToggleSwitch
        enabled={autoRefresh}
        onChange={setAutoRefresh}
        label="Auto Refresh"
        icon={Zap}
      />
      
      <ToggleSwitch
        enabled={secureMode}
        onChange={setSecureMode}
        label="Secure Mode"
        icon={Shield}
      />

      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
        <div className="text-green-400 text-xs mb-2">Neural Network Status</div>
        <div className="text-green-400/70 text-xs">
          • Core: Active<br/>
          • Memory: 2.4GB/4GB<br/>
          • Latency: 12ms<br/>
          • Sync: Real-time
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
