import React from 'react';
import { Outlet } from 'react-router-dom';
import LessonHearts from './LessonHearts.tsx';

const LessonLayout: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-[#f3e0b7]">
      <LessonHearts />
      <div className="h-full overflow-y-auto overscroll-contain hide-scrollbar pt-20 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default LessonLayout; 