
import React, { useState, useEffect } from 'react';
import { getUserUIDAsync } from '../utils/userUtils';
import UserProfile from './profile/UserProfile';
import Achievements from './profile/Achievements';
import TwitterAccount from './profile/TwitterAccount';
import UserBio from './profile/UserBio';

interface ProfileTabProps {
  userBio?: string;
  userTwitter?: string;
}

interface ChromeResponse {
  userNickname?: string;
  isLoggedIn?: boolean;
  titan_user_uid?: string;
}

// Declare global chrome types for extension environment
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: any, callback: (response: any) => void) => void;
        getURL: (path: string) => string;
      };
    };
  }
}

const ProfileTab = ({ userBio, userTwitter }: ProfileTabProps) => {
  const [userNickname, setUserNickname] = useState('CryptoTitan');
  const [userUID, setUserUID] = useState('Loading...');

  // Load user data from extension storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load UID using the same method as background.js
        const uid = await getUserUIDAsync();
        setUserUID(uid);

        if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
          const response = await new Promise<ChromeResponse>((resolve) => {
            window.chrome!.runtime!.sendMessage({ action: 'getUserData' }, resolve);
          });
          
          if (response && response.userNickname) {
            setUserNickname(response.userNickname);
          }
        }
      } catch (error) {
        console.log('Could not load user data from extension storage');
      }
    };

    loadUserData();
  }, []);

  return (
    <div className="p-3 space-y-4 relative">
      <UserProfile userUID={userUID} userNickname={userNickname} />
      <Achievements />
      <TwitterAccount userTwitter={userTwitter} />
      <UserBio userBio={userBio} />
    </div>
  );
};

export default ProfileTab;
