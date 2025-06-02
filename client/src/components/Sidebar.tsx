import React, { useState } from 'react';

const Sidebar: React.FC = () => {
  const [selectedButton, setSelectedButton] = useState<string | null>('yap');

  return (
    <>
      {/* Logo */}
      <div className="mt-1">
        <div className="flex items-center justify-center">
          <img src="/src/assets 2/logo.png" alt="YapGPT Logo" className="w-40 h-40" />
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="mt-10">
        <div className="flex flex-col w-full">
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 group ${
                selectedButton === 'yap' 
                  ? 'bg-[#f3e0b7] border-2 border-[#e15831]' 
                  : ''
              }`}
              aria-label="Yap"
              onClick={() => setSelectedButton('yap')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'yap' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/src/assets 2/yap.png" alt="Yap" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'yap' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>YAP</span>
              </div>
            </button>
          </div>
          
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 group ${
                selectedButton === 'leaderboard' 
                  ? 'bg-[#f3e0b7] border-2 border-[#e15831]' 
                  : ''
              }`}
              aria-label="Leaderboard"
              onClick={() => setSelectedButton('leaderboard')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'leaderboard' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/src/assets 2/leaderboards.png" alt="Leaderboard" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'leaderboard' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>LEADERBOARD</span>
              </div>
            </button>
          </div>
          
          <div className="mb-4 w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 group ${
                selectedButton === 'flirt' 
                  ? 'bg-[#f3e0b7] border-2 border-[#e15831]' 
                  : ''
              }`}
              aria-label="Flirt"
              onClick={() => setSelectedButton('flirt')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'flirt' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/src/assets 2/flirt.png" alt="Flirt" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'flirt' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>FLIRT</span>
              </div>
            </button>
          </div>
          
          <div className="w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 group ${
                selectedButton === 'profile' 
                  ? 'bg-[#f3e0b7] border-2 border-[#e15831]' 
                  : ''
              }`}
              aria-label="Profile"
              onClick={() => setSelectedButton('profile')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'profile' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/src/assets 2/profile.png" alt="Profile" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'profile' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>PROFILE</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 