import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [selectedButton, setSelectedButton] = useState<string | null>(null);

  return (
    <>
      {/* Logo */}
      <div className="mt-1">
        <div className="flex items-center space-x-2">
          <span className="text-5xl">🦓</span>
          <span className="text-2xl font-bold tracking-wider text-purple-500">YapGPT</span>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="mt-10">
        <div className="flex flex-col w-full">
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 ${
                selectedButton === 'yap' 
                  ? 'bg-gray-700 border-2 border-purple-500' 
                  : 'hover:bg-gray-700'
              }`}
              aria-label="Yap"
              onClick={() => setSelectedButton('yap')}
            >
              <div className="flex items-center space-x-4 text-2xl px-2 py-3">
                <span className="w-8">🗣️</span>
                <span className={`text-sm font-medium ${selectedButton === 'yap' ? 'text-purple-500' : 'text-white'}`}>YAP</span>
              </div>
            </button>
          </div>
          
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 ${
                selectedButton === 'leaderboard' 
                  ? 'bg-gray-700 border-2 border-purple-500' 
                  : 'hover:bg-gray-700'
              }`}
              aria-label="Leaderboard"
              onClick={() => setSelectedButton('leaderboard')}
            >
              <div className="flex items-center space-x-4 text-2xl px-2 py-3">
                <span className="w-8">🏆</span>
                <span className={`text-sm font-medium ${selectedButton === 'leaderboard' ? 'text-purple-500' : 'text-white'}`}>LEADERBOARD</span>
              </div>
            </button>
          </div>
          
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 ${
                selectedButton === 'flirt' 
                  ? 'bg-gray-700 border-2 border-purple-500' 
                  : 'hover:bg-gray-700'
              }`}
              aria-label="Flirt"
              onClick={() => setSelectedButton('flirt')}
            >
              <div className="flex items-center space-x-4 text-2xl px-2 py-3">
                <span className="w-8">💖</span>
                <span className={`text-sm font-medium ${selectedButton === 'flirt' ? 'text-purple-500' : 'text-white'}`}>FLIRT</span>
              </div>
            </button>
          </div>
          
          <div className="w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 ${
                selectedButton === 'profile' 
                  ? 'bg-gray-700 border-2 border-purple-500' 
                  : 'hover:bg-gray-700'
              }`}
              aria-label="Profile"
              onClick={() => setSelectedButton('profile')}
            >
              <div className="flex items-center space-x-4 text-2xl px-2 py-3">
                <span className="w-8">👤</span>
                <span className={`text-sm font-medium ${selectedButton === 'profile' ? 'text-purple-500' : 'text-white'}`}>PROFILE</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 