import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const LeaderboardsSidebar = () => {
    return (_jsx("div", { className: "w-[400px] bg-[#17475c] text-white px-4 pt-4 pb-2 rounded-xl shadow-lg", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "space-y-4 w-1/2", children: [_jsx("h2", { className: "text-sm text-gray-400 whitespace-nowrap", children: "WHAT ARE LEADERBOARDS?" }), _jsx("p", { className: "text-2xl font-medium text-white", children: "Do levels. Compete." }), _jsx("p", { className: "text-base text-white mb-8", children: "More levels you complete, the higher you rank compared to other yappers" })] }), _jsx("div", { className: "w-1/2 flex justify-end items-end mt-4", children: _jsx("img", { src: "/assets/compete.png", alt: "Compete", className: "w-48 h-auto translate-y-5" }) })] }) }));
};
export default LeaderboardsSidebar;
