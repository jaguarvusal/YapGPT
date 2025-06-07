import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SessionAnalysis = ({ onFlirtAgain }) => {
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-[#f3e0b7]", children: _jsxs("div", { className: "bg-[#17475c] rounded-lg p-8 w-96", children: [_jsx("h2", { className: "text-white text-2xl font-bold mb-8 text-center", children: "Session Analysis" }), _jsx("button", { onClick: onFlirtAgain, className: "w-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors", children: "Flirt Again" })] }) }));
};
export default SessionAnalysis;
