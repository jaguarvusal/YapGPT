import React from 'react';
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon';

const dayOneMessages = [
  "🌟 Every mastery begins with Day 1!",
  "💫 The journey of a thousand miles begins with a single step!",
  "✨ Every expert was once a beginner. You're on your way!",
  "🎯 Day 1 is where legends begin!",
  "🌈 The first step is always the most important one!"
];

const streakMessages = [
  "🔥 Amazing streak! Keep the momentum going!",
  "🌟 You're on fire! Don't let this streak break!",
  "💪 Consistency is key! You're crushing it!",
  "🚀 Look at you go! Keep up the great work!",
  "✨ Your dedication is inspiring! Keep it up!",
  "🎯 Perfect streak! You're unstoppable!",
  "💫 Every day counts! You're doing great!",
  "🌈 Your progress is incredible! Keep going!",
  "⭐️ You're making it happen! Stay consistent!",
  "🎉 Another day, another victory! Keep it up!"
];

const StreakPopup: React.FC = () => {
  const { streak, showStreakPopup, setShowStreakPopup } = useStreak();
  
  if (!showStreakPopup) return null;

  // Select appropriate message
  const message = streak === 1 
    ? dayOneMessages[Math.floor(Math.random() * dayOneMessages.length)]
    : streakMessages[Math.floor(Math.random() * streakMessages.length)];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#f3e0b7] p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border-2 border-[#17475c]">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <StreakIcon className="w-16 h-16 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-2">
            {streak === 1 ? "Day 1 - Let's Begin!" : `${streak} Day${streak !== 1 ? 's' : ''} Streak!`}
          </h2>
          <p className="text-xl text-gray-700 mb-6">{message}</p>
          <button
            onClick={() => setShowStreakPopup(false)}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakPopup; 