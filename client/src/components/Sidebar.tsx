import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER, UPDATE_PROGRESS, UPDATE_HEARTS_AND_STREAK } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from '/assets/password.png';
import { FaHome, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedButton, setSelectedButton] = useState<string | null>(() => {
    if (location.pathname === '/leaderboards') return 'leaderboard';
    if (location.pathname === '/flirt') return 'flirt';
    if (location.pathname === '/me' || location.pathname.startsWith('/profile/') || location.pathname === '/search-friends' || location.pathname === '/avatar') return 'profile';
    return 'yap';
  });
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [activeForm, setActiveForm] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    identifier: '',
  });
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
  });
  const [passwordError, setPasswordError] = useState('');

  const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
  const [login, { error: loginError }] = useMutation(LOGIN_USER);
  const [updateProgress] = useMutation(UPDATE_PROGRESS);
  const [updateHeartsAndStreak] = useMutation(UPDATE_HEARTS_AND_STREAK);

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

  useEffect(() => {
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

  useEffect(() => {
    const password = formState.password;
    const newCriteria = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };
    setPasswordCriteria(newCriteria);

    if (password && !Object.values(newCriteria).every(Boolean)) {
      const missingCriteria = [];
      if (!newCriteria.length) missingCriteria.push('8+ characters');
      if (!newCriteria.lowercase) missingCriteria.push('lowercase letter');
      if (!newCriteria.uppercase) missingCriteria.push('uppercase letter');
      setPasswordError(`Password must contain: ${missingCriteria.join(', ')}`);
    } else {
      setPasswordError('');
    }
  }, [formState.password]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setPasswordError('Please meet all password requirements');
      return;
    }
    try {
      // Get local progress before signup
      const localActiveLevel = Number(localStorage.getItem('activeLevel') || '1');
      const localCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');
      const localHearts = Number(localStorage.getItem('hearts') || '5');
      const localHeartRegenerationTimer = localStorage.getItem('heartRegenerationTimer');
      const localStreak = Number(localStorage.getItem('streak') || '0');
      const today = new Date().toISOString(); // Always use current date for new accounts

      // Only send required fields to the mutation
      const { identifier, ...signupData } = formState;
      
      const { data } = await addYapper({
        variables: { input: signupData },
      });
      
      if (data?.addYapper?.token) {
        // Login first to establish user context
        Auth.login(data.addYapper.token);
        
        // Immediately sync progress after signup
        try {
          // Update progress (level and completed levels)
          const { data: progressData } = await updateProgress({
            variables: {
              activeLevel: localActiveLevel,
              completedLevels: localCompletedLevels
            }
          });
          
          // Update hearts and streak
          const { data: heartsData } = await updateHeartsAndStreak({
            variables: {
              hearts: localHearts,
              streak: localStreak,
              lastLoginDate: today, // Use current date
              heartRegenerationTimer: localHeartRegenerationTimer
            }
          });
          
          // Update localStorage with the confirmed progress from the server
          if (progressData?.updateProgress) {
            localStorage.setItem('activeLevel', progressData.updateProgress.activeLevel.toString());
            localStorage.setItem('completedLevels', JSON.stringify(progressData.updateProgress.completedLevels));
          }

          if (heartsData?.updateHeartsAndStreak) {
            localStorage.setItem('hearts', heartsData.updateHeartsAndStreak.hearts.toString());
            if (heartsData.updateHeartsAndStreak.heartRegenerationTimer) {
              localStorage.setItem('heartRegenerationTimer', heartsData.updateHeartsAndStreak.heartRegenerationTimer);
            }
            localStorage.setItem('streak', heartsData.updateHeartsAndStreak.streak.toString());
            localStorage.setItem('lastLoginDate', today); // Use current date
          }
          
          console.log('Progress synced after signup');
        } catch (updateError) {
          console.error('Error syncing progress after signup:', updateError);
        }

        // Clear all states
        setFormState({ name: '', email: '', password: '', identifier: '' });
        setPasswordError('');
        setShowPasswordTooltip(false);
        setShowPassword(false);
        setShowAuthPopup(false);
      }
    } catch (e: any) {
      // Handle duplicate key errors
      if (e.message?.includes('duplicate key error')) {
        if (e.message.includes('name_1')) {
          setSignupError('This username is already taken. Please choose a different one.');
        } else if (e.message.includes('email_1')) {
          setSignupError('This email is already registered. Please use a different email or try logging in.');
        } else {
          setSignupError('This account already exists. Please try logging in instead.');
        }
      } else {
        setSignupError('Something went wrong. Please try again.');
      }
      console.error('Signup error:', e);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data } = await login({
        variables: {
          identifier: formState.identifier,
          password: formState.password
        },
      });
      
      if (data?.login?.token) {
        // Login first to establish the user context
        Auth.login(data.login.token);
        
        // Get local progress
        const localActiveLevel = Number(localStorage.getItem('activeLevel') || '1');
        const localCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');

        // Sync progress with server
        try {
          const { data: progressData } = await updateProgress({
            variables: {
              activeLevel: localActiveLevel,
              completedLevels: localCompletedLevels
            }
          });
          
          // Update localStorage with the confirmed progress from the server
          if (progressData?.updateProgress) {
            localStorage.setItem('activeLevel', progressData.updateProgress.activeLevel.toString());
            localStorage.setItem('completedLevels', JSON.stringify(progressData.updateProgress.completedLevels));
          }
          
          console.log('Progress synced after login');
        } catch (updateError) {
          console.error('Error syncing progress after login:', updateError);
        }

        setShowAuthPopup(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Logo */}
      <div className="mt-1">
        <div className="flex items-center justify-center">
          <img src="/assets/logo.png" alt="YapGPT Logo" className="w-40 h-40" />
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
              onClick={() => handleNavigation('/', 'yap')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'yap' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/assets/yap.png" alt="Yap" className="w-full h-full object-contain" />
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
              onClick={() => handleNavigation('/leaderboards', 'leaderboard')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'leaderboard' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/assets/leaderboards.png" alt="Leaderboard" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'leaderboard' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>LEAGUE</span>
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
              onClick={() => handleNavigation('/flirt', 'flirt')}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'flirt' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16">
                  <img src="/assets/flirt.png" alt="Flirt" className="w-full h-full object-contain" />
                </span>
                <span className={`text-sm font-medium ${
                  selectedButton === 'flirt' 
                    ? 'text-[#e15831]' 
                    : 'text-white group-hover:text-[#17475c]'
                }`}>RIZZ</span>
              </div>
            </button>
          </div>
          
          <div className="w-full">
            <button 
              className={`w-[90%] rounded-xl transition-all duration-150 group relative ${
                selectedButton === 'profile' 
                  ? 'bg-[#f3e0b7] border-2 border-[#e15831]' 
                  : ''
              }`}
              aria-label="Profile"
              onClick={handleProfileClick}
            >
              <div className={`flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${
                selectedButton !== 'profile' ? 'group-hover:bg-[#f3e0b7]' : ''
              }`}>
                <span className="w-16 h-16 relative">
                  {!Auth.loggedIn() && (
                    <div className="absolute -top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                  <img src="/assets/profile.png" alt="Profile" className="w-full h-full object-contain" />
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

      {/* Auth Popup */}
      {showAuthPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[2000]">
          <div className="bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowAuthPopup(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            
            <p className="text-black text-center mb-6 text-xl font-bold">
              {activeForm === 'signup' 
                ? 'Create a Profile to Add Friends, compete, and more!'
                : 'Login in to view your friends, compete, and more!'}
            </p>

            {/* Tab Buttons */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveForm('signup')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${
                  activeForm === 'signup'
                    ? 'bg-[#e15831] text-white border-[#b34426]' 
                    : 'bg-[#e15831] text-white border-[#b34426]'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setActiveForm('login')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${
                  activeForm === 'login'
                    ? 'bg-[#17475c] text-white border-[#123a4c]' 
                    : 'bg-[#17475c] text-white border-[#123a4c]'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Form Content */}
            <div className={`${activeForm === 'signup' ? 'bg-[#e15831]' : 'bg-[#17475c]'} rounded-lg p-6 text-white`}>
              {activeForm === 'signup' ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={formState.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formState.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formState.password}
                      onChange={handleChange}
                      onFocus={() => setShowPasswordTooltip(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget?.closest('button[type="submit"]')) {
                          setShowPasswordTooltip(false);
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <img 
                        src={passwordIcon} 
                        alt="Toggle password visibility" 
                        className={`w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}`}
                      />
                    </button>
                  </div>
                  {showPasswordTooltip && (
                    <div className="relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50">
                      <div className="space-y-2">
                        <p className={`text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordCriteria.length ? '✓' : '○'} 8+ Characters
                        </p>
                        <p className={`text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordCriteria.lowercase ? '✓' : '○'} At least one lowercase letter
                        </p>
                        <p className={`text-sm ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                          {passwordCriteria.uppercase ? '✓' : '○'} At least one uppercase letter
                        </p>
                      </div>
                    </div>
                  )}
                  {passwordError && (
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  )}
                  {signupError && (
                    <p className="text-red-500 text-sm">{signupError.message}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium"
                  >
                    Create Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      name="identifier"
                      placeholder="Email or Username"
                      value={formState.identifier}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formState.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    >
                      <img 
                        src={passwordIcon} 
                        alt="Toggle password visibility" 
                        className={`w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}`}
                      />
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-red-500 text-sm">
                      {loginError.message === '[function AuthenticationError]' 
                        ? 'Invalid email or password' 
                        : loginError.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium"
                  >
                    Log In
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar; 