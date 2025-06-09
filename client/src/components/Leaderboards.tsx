import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER, UPDATE_PROGRESS, UPDATE_HEARTS_AND_STREAK } from '../utils/mutations';
import { QUERY_ME } from '../utils/queries';
import Auth from '../utils/auth';
import passwordIcon from '/assets/password.png';
import leaderboardPreview from '/assets/leaderboardpreview.png';
import { getRandomColor } from '../utils/colors';
import DefaultAvatar from './DefaultAvatar';

const Leaderboards: React.FC = () => {
  const [activeForm, setActiveForm] = useState<'signup' | 'login' | null>(null);
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
  const formRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: meData, refetch } = useQuery(QUERY_ME, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first'
  });
  const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
  const [login, { error: loginError }] = useMutation(LOGIN_USER);
  const [updateProgress] = useMutation(UPDATE_PROGRESS);
  const [updateHeartsAndStreak] = useMutation(UPDATE_HEARTS_AND_STREAK);

  useEffect(() => {
    setIsLoggedIn(Auth.loggedIn());

    const password = formState.password;
    const newCriteria = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };
    setPasswordCriteria(newCriteria);

    // Set error message if password doesn't meet criteria
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

  useEffect(() => {
    if (isLoggedIn) {
      refetch();
      // Set up periodic refetch every 30 seconds
      const interval = setInterval(() => {
        refetch();
      }, 30000);

      return () => clearInterval(interval);
    }
    return () => {}; // Add return for when isLoggedIn is false
  }, [isLoggedIn, refetch]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  const handleFormToggle = (form: 'signup' | 'login') => {
    setActiveForm(activeForm === form ? null : form);
    // Scroll to form after a short delay to ensure it's rendered
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Check if password meets all criteria
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
        setActiveForm(null);
      }
    } catch (e: any) {
      // Handle duplicate key errors
      if (e.message?.includes('duplicate key error')) {
        if (e.message.includes('name_1')) {
          console.error('This username is already taken. Please choose a different one.');
        } else if (e.message.includes('email_1')) {
          console.error('This email is already registered. Please use a different email or try logging in.');
        } else {
          console.error('This account already exists. Please try logging in instead.');
        }
      } else {
        console.error('Something went wrong. Please try again.');
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
        
        // Get server progress from login response
        const serverActiveLevel = data.login.yapper.activeLevel;
        const serverCompletedLevels = data.login.yapper.completedLevels;
        
        // Update localStorage with server progress
        localStorage.setItem('activeLevel', serverActiveLevel.toString());
        localStorage.setItem('completedLevels', JSON.stringify(serverCompletedLevels));
        
        console.log('Progress synced from server after login:', {
          activeLevel: serverActiveLevel,
          completedLevels: serverCompletedLevels
        });

        setActiveForm(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderLeaderboard = () => {
    if (!meData?.me) return null;

    const currentUser = meData.me;
    const leaderboardUsers = [
      {
        _id: currentUser._id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        activeLevel: currentUser.activeLevel || 1
      },
      ...(currentUser.following || []).map((user: any) => ({
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        activeLevel: user.activeLevel || 1
      }))
    ];

    // Sort by active level in descending order
    leaderboardUsers.sort((a, b) => (b.activeLevel || 1) - (a.activeLevel || 1));

    return (
      <div className="mt-6 mb-8 bg-[#17475c] backdrop-blur-md rounded-xl p-3 md:p-4 shadow-lg border-4 border-[#17475c] w-full">
        {/* Column Titles */}
        <div className="flex items-center space-x-2 md:space-x-4 mb-3 px-2 md:px-3">
          <span className="text-[#e15831] font-bold w-8 md:w-12 text-sm md:text-base">RANK</span>
          <div className="w-10 md:w-14"></div>
          <span className="text-[#e15831] font-bold flex-1 text-sm md:text-base">WHO?</span>
          <span className="text-[#e15831] font-bold text-sm md:text-base">LEVEL</span>
        </div>
        <div className="space-y-2 md:space-y-3">
          {leaderboardUsers.map((user, index) => (
            <div 
              key={user._id} 
              className={`flex items-center space-x-2 md:space-x-4 p-2 md:p-3 rounded-lg ${
                user._id === currentUser._id 
                  ? 'bg-[#e15831]' 
                  : 'bg-[#1a5266]'
              }`}
            >
              <div className="flex items-center w-8 md:w-12">
                <span className={`font-bold text-sm md:text-base ${user._id === currentUser._id ? 'text-black' : 'text-white'}`}>
                  {index + 1}
                </span>
                {index === 0 && (
                  <img src="/assets/gold.png" alt="Gold Medal" className="w-8 h-8 md:w-10 md:h-10 ml-1" />
                )}
                {index === 1 && (
                  <img src="/assets/silver.png" alt="Silver Medal" className="w-8 h-8 md:w-10 md:h-10 ml-1" />
                )}
                {index === 2 && (
                  <img src="/assets/bronze.png" alt="Bronze Medal" className="w-8 h-8 md:w-10 md:h-10 ml-1" />
                )}
              </div>
              <div 
                className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 md:border-4 border-black flex-shrink-0"
                style={{ backgroundColor: getRandomColor(user.name) }}
              >
                {user.avatar ? (
                  <img 
                    src={`/assets/${user.avatar}`}
                    alt={`${user.name}'s avatar`}
                    className="w-full h-full object-cover object-bottom translate-y-[15%]"
                  />
                ) : (
                  <DefaultAvatar username={user.name} className="w-full h-full text-xl md:text-2xl" />
                )}
              </div>
              <span className={`font-medium flex-1 text-sm md:text-base ${user._id === currentUser._id ? 'text-black' : 'text-white'}`}>
                {user.name}
              </span>
              <span className={`font-bold text-sm md:text-base ${user._id === currentUser._id ? 'text-black' : 'text-white'}`}>
                Level {user.activeLevel}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center pt-4 px-4">
      <img 
        src="/assets/medals.png" 
        alt="Medals" 
        className="w-48 md:w-64 h-auto mb-2"
      />
      <h1 className="text-2xl md:text-3xl font-bold text-black mb-1 text-center">
        {isLoggedIn ? "Welcome to Yap League!" : "Unlock Leaderboards!"}
      </h1>
      <p className="text-gray-600 text-sm md:text-base mb-4 text-center">
        {isLoggedIn ? "Follow more friends to join your Yap League adventure!" : "Create an account or login to start competing"}
      </p>
      
      {isLoggedIn && (
        <div className="w-full max-w-[600px]">
          {renderLeaderboard()}
        </div>
      )}
      
      {!isLoggedIn && (
        <>
          <div className="flex space-x-3 w-full max-w-[320px]">
            <button 
              onClick={() => handleFormToggle('signup')}
              className="w-1/2 bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium"
            >
              Sign Up
            </button>
            <button 
              onClick={() => handleFormToggle('login')}
              className="w-1/2 bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium"
            >
              Log In
            </button>
          </div>

          {/* Signup Form */}
          {activeForm === 'signup' && (
            <div ref={formRef} className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-full max-w-[320px] border-4 border-dashed border-[#17475c] animate-fadeIn">
              <h2 className="text-lg font-semibold mb-6 text-black">Create a Profile</h2>
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
                    onFocus={() => {
                      setShowPasswordTooltip(true);
                    }}
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
                      className="w-5 h-5"
                    />
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium"
                >
                  Sign Up
                </button>
              </form>
            </div>
          )}

          {/* Login Form */}
          {activeForm === 'login' && (
            <div ref={formRef} className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-full max-w-[320px] border-4 border-dashed border-[#17475c] animate-fadeIn">
              <h2 className="text-lg font-semibold mb-6 text-black">Welcome Back!</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Email or Username"
                    value={formState.identifier}
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
                      className="w-5 h-5"
                    />
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium"
                >
                  Log In
                </button>
              </form>
            </div>
          )}

          {/* Leaderboard Preview Image */}
          <img 
            src={leaderboardPreview} 
            alt="Leaderboard Preview" 
            className="w-full max-w-[320px] h-auto mt-4"
          />
        </>
      )}
    </div>
  );
};

export default Leaderboards;