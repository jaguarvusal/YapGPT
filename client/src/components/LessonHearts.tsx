import React from 'react';
import Hearts from './Hearts';

const LessonHearts: React.FC = () => {
  return (
    <div className="fixed right-4 top-4 z-50">
      <div className="bg-gray-700 rounded-xl p-4 shadow-lg">
        <h2 className="text-lg font-semibold text-white mb-2">Lives</h2>
        <Hearts />
      </div>
    </div>
  );
};

export default LessonHearts; 