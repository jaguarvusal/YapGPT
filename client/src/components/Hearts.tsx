import React from 'react';
import { useHearts } from '../contexts/HeartsContext';

const Hearts: React.FC = () => {
  const { hearts, timeUntilRegeneration } = useHearts();

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            className={`w-6 h-6 ${index < hearts ? 'text-red-500' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>
      {hearts === 0 && timeUntilRegeneration && (
        <div className="text-sm text-gray-400">
          <p>Hearts will regenerate in:</p>
          <p className="font-mono text-yellow-500">{formatTime(timeUntilRegeneration)}</p>
        </div>
      )}
    </div>
  );
};

export default Hearts; 