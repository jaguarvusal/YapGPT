import React from 'react';

interface MobileTopBarProps {
  hearts: number;
  streak: number;
  isVisible?: boolean;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ hearts, streak, isVisible = false }) => {
  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-[#17475c] z-[9999] border-b-4 border-dashed border-gray-700 h-12">
      <div className="grid grid-cols-2 h-full">
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-red-500"
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
            <span className="text-lg font-semibold text-white">{hearts}</span>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg font-semibold text-white">{streak}</span>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[1px] bg-gray-500"></div>
      </div>
    </div>
  );
};

export default MobileTopBar; 