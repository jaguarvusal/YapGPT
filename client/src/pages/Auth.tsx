import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER, UPDATE_PROGRESS, UPDATE_HEARTS_AND_STREAK } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from "/assets/password.png";
import welcomeImage from "/assets/welcome.png";
import welcomebackImage from "/assets/welcomeback.png";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    identifier: '',
  });
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeForm, setActiveForm] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
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

  useEffect(() => {
    // Trigger fade in on mount
    setIsVisible(true);
  }, []);

  useEffect(() => {
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState({
      ...formState,
      [name]: value,
    });

    if (name === 'password') {
      setPasswordCriteria({
        length: value.length >= 8,
        lowercase: /[a-z]/.test(value),
        uppercase: /[A-Z]/.test(value),
      });
    }
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
        navigate('/me');
      }
    } catch (e: any) {
      // Handle duplicate key errors
      if (e.message?.includes('duplicate key error')) {
        if (e.message.includes('name_1')) {
          setError('This username is already taken. Please choose a different one.');
        } else if (e.message.includes('email_1')) {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else {
          setError('This account already exists. Please try logging in instead.');
        }
      } else {
        setError('Something went wrong. Please try again.');
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
        
        // Get server data from login response
        const serverActiveLevel = data.login.yapper.activeLevel;
        const serverCompletedLevels = data.login.yapper.completedLevels;
        const serverHearts = data.login.yapper.hearts;
        const serverHeartRegenerationTimer = data.login.yapper.heartRegenerationTimer;
        
        // Update localStorage with server data
        localStorage.setItem('activeLevel', serverActiveLevel.toString());
        localStorage.setItem('completedLevels', JSON.stringify(serverCompletedLevels));
        localStorage.setItem('hearts', serverHearts.toString());
        if (serverHeartRegenerationTimer) {
          localStorage.setItem('heartRegenerationTimer', serverHeartRegenerationTimer);
        } else {
          localStorage.removeItem('heartRegenerationTimer');
        }
        
        console.log('Data synced from server after login:', {
          activeLevel: serverActiveLevel,
          completedLevels: serverCompletedLevels,
          hearts: serverHearts,
          heartRegenerationTimer: serverHeartRegenerationTimer
        });

        navigate('/me');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExit = () => {
    setIsVisible(false);
    setTimeout(() => {
      navigate(-1);
    }, 300); // Match this with the animation duration
  };

  return (
    <div 
      className={`flex min-h-screen bg-[#f3e0b7] transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Left side - Welcome image */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-8">
        <img 
          src={activeForm === 'signup' ? welcomeImage : welcomebackImage} 
          alt="Welcome" 
          className="w-full max-w-6xl object-contain translate-x-16 border-[16px] border-black rounded-3xl"
        />
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative">
        <button 
          onClick={handleExit}
          className="absolute top-8 right-8 text-gray-600 hover:text-gray-800 text-3xl font-bold transition-colors duration-150 z-10"
        >
          ✕
        </button>
        <div className="bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-8 max-w-md w-full mx-4 relative shadow-lg border-4 border-[#17475c]">
          <h1 className="text-2xl font-bold text-center mb-8 text-black">
            {activeForm === 'signup' 
              ? 'Create a Profile to Add Friends, compete, and more!'
              : 'Login to view your friends, compete, and more!'}
          </h1>

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
              SIGN UP
            </button>
            <button
              onClick={() => setActiveForm('login')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${
                activeForm === 'login'
                  ? 'bg-[#17475c] text-white border-[#123a4c]' 
                  : 'bg-[#17475c] text-white border-[#123a4c]'
              }`}
            >
              LOG IN
            </button>
          </div>

          {/* Form Content */}
          <div className={`${activeForm === 'signup' ? 'bg-[#e15831]' : 'bg-[#17475c]'} rounded-lg p-6 text-white relative`}>
            <div className={`transition-all duration-300 ease-in-out ${activeForm === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>
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
                {/* Password Criteria Tooltip */}
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
                  <p className="text-red-800 text-sm">{passwordError}</p>
                )}
                {signupError && (
                  <p className="text-red-500 text-sm">
                    {signupError.message === '[function AuthenticationError]' 
                      ? 'Invalid email or password' 
                      : signupError.message}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 uppercase font-medium"
                >
                  START YAPPING!
                </button>
              </form>
            </div>
            <div className={`transition-all duration-300 ease-in-out ${activeForm === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute'}`}>
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
                  className="w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 uppercase font-medium"
                >
                  START YAPPING!
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 