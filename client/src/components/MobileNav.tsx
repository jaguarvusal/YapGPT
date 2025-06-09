import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Auth from '../utils/auth';

const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedButton, setSelectedButton] = React.useState<string | null>(() => {
    if (location.pathname === '/leaderboards') return 'leaderboard';
    if (location.pathname === '/flirt') return 'flirt';
    if (location.pathname === '/me' || location.pathname.startsWith('/profile/') || location.pathname === '/search-friends' || location.pathname === '/avatar') return 'profile';
    return 'yap';
  });

  const handleNavigation = (path: string, button: string) => {
    navigate(path);
    setSelectedButton(button);
  };

  const handleProfileClick = () => {
    if (!Auth.loggedIn()) {
      navigate('/auth');
      setSelectedButton('profile');
    } else {
      navigate('/me');
    }
  };

  React.useEffect(() => {
    if (location.pathname === '/leaderboards') {
      setSelectedButton('leaderboard');
    } else if (location.pathname === '/flirt') {
      setSelectedButton('flirt');
    } else if (location.pathname === '/me' || location.pathname.startsWith('/profile/') || location.pathname === '/search-friends' || location.pathname === '/avatar') {
      setSelectedButton('profile');
    } else if (location.pathname === '/') {
      setSelectedButton('yap');
    }
  }, [location.pathname]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#17475c] border-t-4 border-dashed border-gray-700 z-50">
      <div className="flex justify-around items-center h-20">
        <button
          onClick={() => handleNavigation('/', 'yap')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${
            selectedButton === 'yap' ? 'text-[#e15831]' : 'text-white'
          }`}
        >
          <img src="/assets/yap.png" alt="Yap" className="w-10 h-10" />
          <span className="text-sm mt-1 font-medium">YAP</span>
        </button>

        <button
          onClick={() => handleNavigation('/leaderboards', 'leaderboard')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${
            selectedButton === 'leaderboard' ? 'text-[#e15831]' : 'text-white'
          }`}
        >
          <img src="/assets/leaderboards.png" alt="Leaderboard" className="w-10 h-10" />
          <span className="text-sm mt-1 font-medium">LEAGUE</span>
        </button>

        <button
          onClick={() => handleNavigation('/flirt', 'flirt')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${
            selectedButton === 'flirt' ? 'text-[#e15831]' : 'text-white'
          }`}
        >
          <img src="/assets/flirt.png" alt="Flirt" className="w-10 h-10" />
          <span className="text-sm mt-1 font-medium">RIZZ</span>
        </button>

        <button
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center w-1/4 h-full relative ${
            selectedButton === 'profile' ? 'text-[#e15831]' : 'text-white'
          }`}
        >
          {!Auth.loggedIn() && (
            <div className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full"></div>
          )}
          <img src="/assets/profile.png" alt="Profile" className="w-10 h-10" />
          <span className="text-sm mt-1 font-medium">PROFILE</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNav; 