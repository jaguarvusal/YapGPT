import React from 'react';
import Hearts from './Hearts.tsx';

const LessonHearts: React.FC = () => {
  return (
    <div className="md:fixed md:right-4 md:top-4 z-50 w-full md:w-auto">
      <div className="bg-[#f3e0b7] rounded-xl p-4 shadow-lg border-4 border-[#17475c] md:mx-4 mx-6 mt-4">
        <h2 className="text-lg font-semibold text-black mb-2">Lives</h2>
        <Hearts />
      </div>
    </div>
  );
};

export default LessonHearts; 