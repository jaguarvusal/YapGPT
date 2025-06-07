import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon.tsx';
const streakMessages = [
    "🔥 Amazing streak! Keep the momentum going!",
    "🌟 You're on fire! Don't let this streak break!",
    "💪 Consistency is key! You're crushing it!",
    "🚀 Look at you go! Keep up the great work!",
    "✨ Your dedication is inspiring! Keep it up!",
    "🎯 Perfect streak! You're unstoppable!",
    "💫 Every day counts! You're doing great!",
    "🌈 Your progress is incredible! Keep going!",
    "⭐️ You're making it happen! Stay consistent!",
    "🎉 Another day, another victory! Keep it up!"
];
const StreakPopup = () => {
    const { streak, showStreakPopup, setShowStreakPopup } = useStreak();
    if (!showStreakPopup)
        return null;
    const message = streakMessages[streak % streakMessages.length];
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-[#f3e0b7] p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border-2 border-[#17475c]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-6 flex justify-center", children: _jsx(StreakIcon, { className: "w-16 h-16 text-orange-500" }) }), _jsxs("h2", { className: "text-3xl font-bold text-black mb-2", children: [streak, " Day", streak !== 1 ? 's' : '', " Streak!"] }), _jsx("p", { className: "text-xl text-gray-700 mb-6", children: message }), _jsx("button", { onClick: () => setShowStreakPopup(false), className: "px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors", children: "Let's Go!" })] }) }) }));
};
export default StreakPopup;
