import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER, UPDATE_PROGRESS } from '../utils/mutations.js';
import Auth from '../utils/auth';
import Hearts from './Hearts.tsx';
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon.tsx';
import passwordIcon from '/assets/password.png';

const RightSidebar: React.FC = () => {
  const { streak } = useStreak();
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
  const [signupError, setSignupError] = useState('');

  const [addYapper] = useMutation(ADD_YAPPER);
  const [login, { error: loginError }] = useMutation(LOGIN_USER);
  const [updateProgress] = useMutation(UPDATE_PROGRESS);

  const scrollToForm = () => {
    const formElement = document.getElementById('auth-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
    setTimeout(scrollToForm, 100); // Small delay to ensure the form is rendered
  };

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowSignup(false);
    setTimeout(scrollToForm, 100); // Small delay to ensure the form is rendered
  };

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
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(''); // Clear any previous errors
    
    // Check if password meets all criteria
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setPasswordError('Please meet all password requirements');
      return;
    }

    try {
      // Get local progress before signup
      const localActiveLevel = Number(localStorage.getItem('activeLevel') || '1');
      const localCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');

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
          
          console.log('Progress synced after signup');
        } catch (updateError) {
          console.error('Error syncing progress after signup:', updateError);
        }

        // Clear all states
        setFormState({ name: '', email: '', password: '', identifier: '' });
        setPasswordError('');
        setShowPasswordTooltip(false);
        setShowPassword(false);
        setShowSignup(false);
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

        // Clear form and hide login
        setShowLogin(false);
        setFormState({ name: '', email: '', password: '', identifier: '' });
      }
    } catch (e) {
      console.error('Login error:', e);
    }
  };

  const formatJoinDate = () => {
    const profile = Auth.getProfile();
    if (profile?.data) {
      const date = new Date();
      return `Joined in ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col space-y-4">
        <div className="bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-4 shadow-lg border-4 border-[#17475c]">
          <h2 className="text-lg font-semibold text-black mb-2">Lives</h2>
          <div className="flex justify-center">
            <Hearts />
          </div>
        </div>
        <div className="bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-4 pb-0 shadow-lg border-4 border-[#17475c]">
          <h2 className="text-lg font-semibold text-black mb-2">Streak</h2>
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <StreakIcon className="text-orange-500" />
              <div className="flex items-center -mt-32 -ml-12">
                <span className="text-3xl font-medium text-orange-500 mr-2">Day</span>
                <span className="text-6xl font-semibold text-orange-500">{streak}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div className="sticky top-0 bg-[#f3e0b7]/80 backdrop-blur-md pt-4 pb-2 z-20">
        {/* Health Status */}
        <div className="flex items-center justify-center space-x-8">
        </div>
      </div>

      {/* Profile Card */}
      <div className="mt-0 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c]">
        {Auth.loggedIn() ? (
          <>
            <h2 className="text-lg font-semibold mb-2 text-white">
              {Auth.getProfile().data.username}
            </h2>
            <p className="text-gray-400 text-sm mb-6">{formatJoinDate()}</p>
            <div className="space-y-3">
              <Link 
                to="/me"
                className="block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0"
              >
                View Profile
              </Link>
              <button 
                onClick={() => Auth.logout()}
                className="w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 border-b-4 border-gray-200 active:translate-y-1 active:border-b-0"
              >
                Log Out
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-6 text-black">
              Create a profile to save your progress!
            </h2>
            <div className="space-y-3">
              <button 
                onClick={handleShowSignup}
                className="block w-full bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Sign Up
              </button>
              <button 
                onClick={handleShowLogin}
                className="block w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Log In
              </button>
            </div>
          </>
        )}
      </div>

      {/* Signup Card */}
      {showSignup && (
        <div id="auth-form" className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c] animate-fadeIn">
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
                  // Only hide tooltip if we're not clicking the submit button
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
              <div className="relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50 mb-32">
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
              <div className="mt-2 text-red-500 text-sm">
                {signupError}
              </div>
            )}
            <div>
              <button
                type="submit"
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Login Card */}
      {showLogin && (
        <div id="auth-form" className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c] animate-fadeIn">
          <h2 className="text-lg font-semibold mb-6 text-black">Log In</h2>
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
                  className={`w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}`}
                />
              </button>
            </div>
            {loginError && (
              <p className="text-red-500 text-sm mt-2">
                {loginError.message === '[function AuthenticationError]' 
                  ? 'Invalid email or password' 
                  : loginError.message}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium"
            >
              Log In
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RightSidebar; 