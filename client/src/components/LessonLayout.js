import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import LessonHearts from './LessonHearts.tsx';
const LessonLayout = () => {
    return (_jsxs("div", { className: "flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[#f3e0b7]", children: [_jsx("div", { className: "shrink-0", children: _jsx(LessonHearts, {}) }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pt-20 md:pt-0", children: _jsx(Outlet, {}) })] }));
};
export default LessonLayout;
