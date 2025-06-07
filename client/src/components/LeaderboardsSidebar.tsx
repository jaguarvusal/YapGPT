import React from 'react';

const LeaderboardsSidebar: React.FC = () => {
  return (
    <div className="w-[400px] bg-[#17475c] text-white px-4 pt-4 pb-2 rounded-xl shadow-lg">
      <div className="flex justify-between items-start">
        <div className="space-y-4 w-1/2">
          <h2 className="text-sm text-gray-400 whitespace-nowrap">WHAT ARE LEADERBOARDS?</h2>
          <p className="text-2xl font-medium text-white">Do levels. Compete.</p>
          <p className="text-base text-white mb-8">More levels you complete, the higher you rank compared to other yappers</p>
        </div>
        <div className="w-1/2 flex justify-end items-end mt-4">
          <img src="/assets/compete.png" alt="Compete" className="w-48 h-auto translate-y-5" />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsSidebar; 