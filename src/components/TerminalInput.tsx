
import React from 'react';
import { Code } from 'lucide-react';
import { soundManager } from '../utils/soundUtils';

interface TerminalInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  soundEnabled?: boolean;
}

const TerminalInput = ({ input, onInputChange, onSubmit, soundEnabled }: TerminalInputProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (soundEnabled && newValue.length > input.length) {
      soundManager.playKeypress();
    }
    onInputChange(newValue);
  };

  return (
    <div className="border-t border-green-500/30 bg-gray-900/30 p-3">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Code className="w-4 h-4 text-green-400" />
        <span className="text-green-400 text-sm">$</span>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          className="flex-1 bg-transparent text-green-400 text-sm outline-none placeholder-green-400/50"
          placeholder="Enter command..."
          autoFocus
        />
      </form>
    </div>
  );
};

export default TerminalInput;
