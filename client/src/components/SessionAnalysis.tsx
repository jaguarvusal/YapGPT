import React from 'react';

interface SessionAnalysisProps {
  onFlirtAgain: () => void;
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ onFlirtAgain }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3e0b7]">
      <div className="bg-[#17475c] rounded-lg p-8 w-96">
        <h2 className="text-white text-2xl font-bold mb-8 text-center">Session Analysis</h2>
        <button
          onClick={onFlirtAgain}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Flirt Again
        </button>
      </div>
    </div>
  );
};

export default SessionAnalysis; 