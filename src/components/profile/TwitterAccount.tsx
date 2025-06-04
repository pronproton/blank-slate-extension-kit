
import React from 'react';
import { Twitter } from 'lucide-react';

interface TwitterAccountProps {
  userTwitter?: string;
}

const TwitterAccount = ({ userTwitter }: TwitterAccountProps) => {
  return (
    <div className="bg-gray-900/50 border border-green-500/20 rounded p-3">
      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
        <Twitter className="w-4 h-4" />
        Twitter Account
      </div>
      <div className="flex items-center justify-between">
        <span className="text-green-400 text-xs">
          {userTwitter || 'Not set - use "settwitter @username"'}
        </span>
        <div className={`w-2 h-2 rounded-full ${userTwitter ? 'bg-green-400' : 'bg-gray-500'}`}></div>
      </div>
    </div>
  );
};

export default TwitterAccount;
