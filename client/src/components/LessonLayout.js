import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import LessonHearts from './LessonHearts';
const LessonLayout = () => {
    return (_jsxs("div", { className: "w-full h-screen bg-[#f3e0b7]", children: [_jsx(LessonHearts, {}), _jsx("div", { className: "h-full overflow-y-auto overscroll-contain hide-scrollbar", children: _jsx(Outlet, {}) })] }));
};
export default LessonLayout;
