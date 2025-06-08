import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER, UPDATE_PROGRESS } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from '/assets/password.png';
import leaderboardPreview from '/assets/leaderboardpreview.png';

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

  const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
  const [login, { error: loginError }] = useMutation(LOGIN_USER);
  const [updateProgress] = useMutation(UPDATE_PROGRESS);

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
        setActiveForm(null);
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className="flex-1 flex flex-col items-center pt-4">
      <img 
        src="/assets/medals.png" 
        alt="Medals" 
        className="w-64 h-auto mb-2"
      />
      <h1 className="text-3xl font-bold text-black mb-1">Unlock Leaderboards!</h1>
      <p className="text-gray-600 text-base mb-4">Create an account or login to start competing</p>
      
      <div className="flex space-x-3 w-80">
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
        <div ref={formRef} className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-80 border-4 border-dashed border-[#17475c] animate-fadeIn">
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
        <div ref={formRef} className="mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-80 border-4 border-dashed border-[#17475c] animate-fadeIn">
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
        className="w-[400px] h-auto mt-4"
      />
    </div>
  );
};

export default Leaderboards;