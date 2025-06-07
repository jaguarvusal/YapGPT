import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Hearts from './Hearts';
const LessonHearts = () => {
    return (_jsx("div", { className: "fixed right-4 top-4 z-50", children: _jsxs("div", { className: "bg-[#f3e0b7] rounded-xl p-4 shadow-lg border-4 border-[#17475c]", children: [_jsx("h2", { className: "text-lg font-semibold text-black mb-2", children: "Lives" }), _jsx(Hearts, {})] }) }));
};
export default LessonHearts;
