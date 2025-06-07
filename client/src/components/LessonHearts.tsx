import React from 'react';
import Hearts from './Hearts';

const LessonHearts: React.FC = () => {
  return (
    <div className="fixed right-4 top-4 z-50">
      <div className="bg-[#f3e0b7] rounded-xl p-4 shadow-lg border-4 border-[#17475c]">
        <h2 className="text-lg font-semibold text-black mb-2">Lives</h2>
        <Hearts />
      </div>
    </div>
  );
};

export default LessonHearts; 