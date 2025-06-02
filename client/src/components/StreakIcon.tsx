import React from 'react';

interface StreakIconProps {
  className?: string;
}

const StreakIcon: React.FC<StreakIconProps> = ({ className = '' }) => {
  return (
    <img
      src="/src/assets 2/streak.png"
      alt="Streak"
      className={`w-32 h-32 mt-4 -ml-4 ${className}`}
    />
  );
};

export default StreakIcon; 