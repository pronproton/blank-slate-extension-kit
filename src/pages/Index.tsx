
import React, { useState, useEffect } from 'react';
import TerminalTabs from '../components/TerminalTabs';
import ProfileTab from '../components/ProfileTab';
import DashboardTab from '../components/DashboardTab';
import SettingsTab from '../components/SettingsTab';
import TerminalHeader from '../components/TerminalHeader';
import NeuralCore from '../components/NeuralCore';
import TerminalOutput from '../components/TerminalOutput';
import TerminalInput from '../components/TerminalInput';
import StatusBar from '../components/StatusBar';
import { createCommands, executeCommand } from '../utils/terminalCommands';
import { soundManager } from '../utils/soundUtils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('terminal');
  const [input, setInput] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCoreMenu, setShowCoreMenu] = useState(false);
  const [userBio, setUserBio] = useState('');
  const [userTwitter, setUserTwitter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(50);

  // Load user data and initialize history
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.storage) {
          const result = await (window as any).chrome.storage.local.get(['userNickname']);
          const nickname = result.userNickname || '';
          setUserNickname(nickname);
          
          const welcomeMessage = nickname 
            ? `Welcome ${nickname.toUpperCase()} to Titan Terminal v1.0.0`
            : 'Welcome to Titan Terminal v1.0.0';
          
          setHistory([
            welcomeMessage,
            'Neural network interface initialized...',
            'Type "help" for available commands',
          ]);
        } else {
          // Fallback for non-extension environment
          setHistory([
            'Welcome to Titan Terminal v1.0.0',
            'Neural network interface initialized...',
            'Type "help" for available commands',
          ]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setHistory([
          'Welcome to Titan Terminal v1.0.0',
          'Neural network interface initialized...',
          'Type "help" for available commands',
        ]);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    soundManager.setVolume(soundVolume);
  }, [soundVolume]);

  const commands = createCommands(setHistory, setActiveTab, setUserBio, setUserTwitter, userNickname);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    soundManager.playCommand();

    const newHistory = [...history, `$ ${input}`];
    const [command, ...args] = input.split(' ');
    
    setIsProcessing(true);
    soundManager.playProcessing();
    
    try {
      const result = await executeCommand(command, args, commands);
      
      if (result !== null) {
        newHistory.push(result);
        if (result.includes('Error') || result.includes('Unknown') || result.includes('Ошибка')) {
          soundManager.playError();
        } else {
          soundManager.playSuccess();
        }
      }
    } catch (error) {
      console.error('Command execution error:', error);
      newHistory.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      soundManager.playError();
    }

    setHistory(newHistory);
    setInput('');
    
    setTimeout(() => setIsProcessing(false), 500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab userBio={userBio} userTwitter={userTwitter} />;
      case 'dashboard':
        return <DashboardTab />;
      case 'settings':
        return (
          <SettingsTab 
            soundEnabled={soundEnabled} 
            onSoundChange={setSoundEnabled}
            soundVolume={soundVolume}
            onVolumeChange={setSoundVolume}
          />
        );
      default:
        return (
          <>
            <TerminalOutput history={history} isProcessing={isProcessing} />
            <TerminalInput 
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              soundEnabled={soundEnabled}
            />
          </>
        );
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-black border border-green-500/30 flex flex-col overflow-hidden font-mono">
      <TerminalHeader />
      <NeuralCore 
        isProcessing={isProcessing}
        showCoreMenu={showCoreMenu}
        onToggleMenu={() => setShowCoreMenu(!showCoreMenu)}
      />
      <TerminalTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderContent()}
      </div>
      <StatusBar />
    </div>
  );
};

export default Index;
