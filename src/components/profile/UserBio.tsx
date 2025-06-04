
import React from 'react';
import { FileText } from 'lucide-react';

interface UserBioProps {
  userBio?: string;
}

const UserBio = ({ userBio }: UserBioProps) => {
  return (
    <div className="bg-gray-900/50 border border-green-500/20 rounded p-3">
      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
        <FileText className="w-4 h-4" />
        Bio
      </div>
      <div className="text-green-400/80 text-xs leading-relaxed">
        {userBio || 'No bio set - use "setbio your bio text"'}
      </div>
    </div>
  );
};

export default UserBio;
