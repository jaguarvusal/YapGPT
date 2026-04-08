import React from 'react';
import { Outlet } from 'react-router-dom';
import LessonHearts from './LessonHearts.tsx';

const LessonLayout: React.FC = () => {
  return (
    <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[#f3e0b7]">
      <div className="shrink-0">
        <LessonHearts />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pt-20 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default LessonLayout; 