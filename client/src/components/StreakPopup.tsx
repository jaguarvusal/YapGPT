import React from 'react';
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon';

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

  const message = streakMessages[streak % streakMessages.length];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border-2 border-gray-700">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <StreakIcon className="w-16 h-16 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {streak} Day{streak !== 1 ? 's' : ''} Streak!
          </h2>
          <p className="text-xl text-gray-300 mb-6">{message}</p>
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