import React from 'react';

interface StreakIconProps {
  className?: string;
}

const StreakIcon: React.FC<StreakIconProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-8 h-8 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        className="stroke-orange-500"
        strokeWidth="2"
        fill="none"
      />
      {/* Inner flame shape */}
      <path
        d="M12 4C12 4 8 8 8 12C8 16 12 20 12 20C12 20 16 16 16 12C16 8 12 4 12 4Z"
        className="fill-orange-500"
      />
      {/* Flame details */}
      <path
        d="M12 6C12 6 10 9 10 12C10 15 12 18 12 18C12 18 14 15 14 12C14 9 12 6 12 6Z"
        className="fill-orange-300"
      />
      {/* Sparkle effect */}
      <path
        d="M12 2L13 4L12 6L11 4L12 2Z"
        className="fill-yellow-300"
      />
      <path
        d="M18 8L19 10L18 12L17 10L18 8Z"
        className="fill-yellow-300"
      />
      <path
        d="M6 8L7 10L6 12L5 10L6 8Z"
        className="fill-yellow-300"
      />
    </svg>
  );
};

export default StreakIcon; 