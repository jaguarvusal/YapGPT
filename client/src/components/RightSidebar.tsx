import React from 'react';
import { Link } from 'react-router-dom';
import Auth from '../utils/auth';

const RightSidebar: React.FC = () => {
  return (
    <>
      {/* Stats Section */}
      <div className="space-y-4 mt-4">
        {/* Login Streak and Health Status */}
        <div className="flex items-center justify-center space-x-8">
          <div className="group relative">
            <div className="flex items-center p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
              <span className="text-3xl">🔥</span>
              <span className="text-lg font-semibold ml-2 text-orange-500">1</span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 hidden group-hover:block z-50">
              {/* Caret */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"></div>
              <div className="relative">
                <div className="text-center mb-3">
                  <p className="font-semibold text-gray-800">1 day streak</p>
                  <p className="text-sm text-gray-600 mt-1">Play a level today to start a new streak!</p>
                </div>
                {/* Weekly Calendar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <span key={day} className="text-xs text-gray-500 w-6 text-center">{day}</span>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {[true, false, false, false, false, false, false].map((isStreak, index) => (
                      <div 
                        key={index}
                        className={`w-6 h-6 rounded-full ${isStreak ? 'bg-blue-500' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="group relative">
            <div className="flex items-center p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
              <span className="text-3xl">❤️</span>
              <span className="text-lg font-semibold ml-2 text-red-500">3</span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 hidden group-hover:block z-50">
              {/* Caret */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45"></div>
              <div className="relative">
                <div className="text-center mb-3">
                  <p className="font-semibold text-gray-800">Hearts</p>
                  <div className="flex justify-center space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((heart) => (
                      <span key={heart} className="text-2xl">❤️</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Keep on improving!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-4 max-w-[350px]">
        <h2 className="text-lg font-semibold mb-4">
          {Auth.loggedIn() ? 'My Profile' : 'Create a profile to save your progress!'}
        </h2>
        
        <div className="space-y-3">
          {Auth.loggedIn() ? (
            <>
              <Link 
                to="/me"
                className="block w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-all duration-150 text-center border-b-4 border-gray-800 active:translate-y-1 active:border-b-0"
              >
                View Profile
              </Link>
              <button 
                onClick={() => Auth.logout()}
                className="w-full border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-150 border-b-4 border-gray-400 active:translate-y-1 active:border-b-0"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/signup"
                className="block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Sign Up
              </Link>
              <Link 
                to="/login"
                className="block w-full border border-cyan-500 text-cyan-500 py-2 px-4 rounded-lg hover:bg-cyan-50 transition-all duration-150 text-center border-b-4 border-cyan-600 active:translate-y-1 active:border-b-0 uppercase font-medium"
              >
                Log In
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RightSidebar; 