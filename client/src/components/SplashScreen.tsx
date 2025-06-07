import React from 'react';
import favicon from '../assets 2/favicon.png';

// Add custom animations for progress bars
const style = document.createElement('style');
style.textContent = `
  @keyframes blue-progress {
    0% {
      stroke-dasharray: 0 251.2;
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dasharray: 125.6 125.6;
      stroke-dashoffset: 0;
    }
  }
  @keyframes orange-progress {
    0% {
      stroke-dasharray: 0 251.2;
      stroke-dashoffset: 251.2;
    }
    100% {
      stroke-dasharray: 125.6 125.6;
      stroke-dashoffset: 251.2;
    }
  }
  .animate-blue-progress {
    animation: blue-progress 2s ease-in-out forwards;
  }
  .animate-orange-progress {
    animation: orange-progress 2s ease-in-out forwards;
  }
`;
document.head.appendChild(style);

interface SplashScreenProps {
  onClick?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onClick }) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-[#f3e0b7]" 
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          {/* Blue semi-circle progress bar (right side) */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                stroke="#17475c"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                transform="rotate(-90 50 50)"
                strokeLinecap="round"
                className="animate-blue-progress"
              />
            </svg>
          </div>
          {/* Orange semi-circle progress bar (left side) */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                stroke="#e15831"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                transform="rotate(90 50 50)"
                strokeLinecap="round"
                className="animate-orange-progress"
              />
            </svg>
          </div>
          {/* Spinning favicon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={favicon}
              alt="Loading"
              className="w-24 h-24 animate-spin"
            />
          </div>
        </div>
        <p className="text-black text-4xl font-bold mt-4">Hang tight...</p>
      </div>
    </div>
  );
};

export default SplashScreen; 