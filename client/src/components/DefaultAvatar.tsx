import React from 'react';
import { getRandomColor } from '../utils/colors';

interface DefaultAvatarProps {
  username: string;
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ username, className = '' }) => {
  const firstChar = username.charAt(0).toUpperCase();
  const backgroundColor = getRandomColor(username);

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-medium ${className}`}
      style={{ backgroundColor }}
    >
      {firstChar}
    </div>
  );
};

export default DefaultAvatar; 