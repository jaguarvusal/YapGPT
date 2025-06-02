import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import Hearts from './Hearts';
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon';

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
  });
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
  });
  const [passwordError, setPasswordError] = useState('');

  const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
  const [login, { error: loginError }] = useMutation(LOGIN_USER);

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
    
    // Check if password meets all criteria
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setPasswordError('Please meet all password requirements');
      return;
    }

    try {
      const { data } = await addYapper({
        variables: { input: { ...formState } },
      });
      
      if (data?.addYapper?.token) {
        // Clear all states first
        setFormState({ name: '', email: '', password: '' });
        setPasswordError('');
        setShowPasswordTooltip(false);
        setShowPassword(false);
        
        // Then login and hide signup form
        Auth.login(data.addYapper.token);
        setShowSignup(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      console.log('Attempting login with:', { identifier: formState.email, password: formState.password });
      const { data } = await login({
        variables: { 
          identifier: formState.email, 
          password: formState.password 
        },
      });
      if (data?.login?.token) {
        Auth.login(data.login.token);
        setShowLogin(false);
        setFormState({ name: '', email: '', password: '' });
      }
    } catch (e: any) {
      console.error('Login error:', e);
      // The error message will be displayed in the UI through the loginError state
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
    <div className="flex flex-col space-y-6">
      <div className="bg-gray-700 rounded-xl p-4">
        <h2 className="text-lg font-semibold text-white mb-2">Lives</h2>
        <Hearts />
      </div>
      {/* Stats Section */}
      <div className="sticky top-0 bg-gray-800 pt-4 pb-2 z-20">
        {/* Login Streak and Health Status */}
        <div className="flex items-center justify-center space-x-8">
          <div className="group relative">
            <div className="flex items-center p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
              <StreakIcon className="text-orange-500" />
              <span className="text-lg font-semibold ml-2 text-orange-500">{streak}</span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 hidden group-hover:block z-50 border-2 border-gray-600">
              {/* Caret */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 transform rotate-45 border-t-2 border-l-2 border-gray-600"></div>
              <p className="text-white text-sm">
                You've logged in for {streak} day{streak !== 1 ? 's' : ''} in a row! Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mt-2 bg-gray-800 rounded-xl shadow-md p-4 max-w-[350px] border-2 border-gray-600">
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
            <h2 className="text-lg font-semibold mb-6 text-white">
              Create a profile to save your progress!
            </h2>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowSignup(true);
                  setShowLogin(false);
                }}
                className="block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Sign Up
              </button>
              <button 
                onClick={() => {
                  setShowLogin(true);
                  setShowSignup(false);
                }}
                className="block w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-200 active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Log In
              </button>
            </div>
          </>
        )}
      </div>

      {/* Signup Card */}
      {showSignup && (
        <div className="mt-4 bg-gray-800 rounded-xl shadow-md p-4 max-w-[350px] border-2 border-gray-600 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-6 text-white">Create a Profile</h2>
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
                {showPassword ? "👁️" : "👁️‍🗨️"}
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
              <p className="text-red-500 text-sm">{signupError.message}</p>
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
        <div className="mt-4 bg-gray-800 rounded-xl shadow-md p-4 max-w-[350px] border-2 border-gray-600 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-6 text-white">Log In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                name="email"
                placeholder="Email or Username"
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
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
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