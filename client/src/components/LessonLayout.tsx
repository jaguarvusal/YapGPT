import React from 'react';
import { Outlet } from 'react-router-dom';

const LessonLayout: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-800">
      <div className="h-full overflow-y-auto overscroll-contain hide-scrollbar">
        <Outlet />
      </div>
    </div>
  );
};

export default LessonLayout; 