import React from 'react';

interface SessionAnalysisProps {
  onFlirtAgain: () => void;
  isLoading?: boolean;
  analysisFeedback?: string;
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ 
  onFlirtAgain, 
  isLoading = false,
  analysisFeedback = 'No feedback available.'
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3e0b7]">
        <div className="bg-[#17475c] rounded-lg p-8 w-96 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 border-4 border-pink-500 rounded-full animate-spin border-t-transparent"></div>
              {/* Inner ring */}
              <div className="absolute inset-4 border-4 border-pink-400/20 rounded-full"></div>
              {/* Center dot */}
              <div className="absolute inset-[30%] bg-pink-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Analyzing Conversation</h2>
            <p className="text-gray-300 text-center">We're analyzing your flirting skills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3e0b7]">
      <div className="bg-[#17475c] rounded-lg p-8 w-[32rem] shadow-xl transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <h2 className="text-white text-3xl font-bold mb-2">Session Complete!</h2>
          <p className="text-gray-300">Here's your personalized feedback</p>
        </div>
        
        <div className="space-y-6 mb-8">
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-white text-xl font-semibold mb-4">Conversation Analysis</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-200 leading-relaxed">
                {analysisFeedback}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onFlirtAgain}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default SessionAnalysis; 