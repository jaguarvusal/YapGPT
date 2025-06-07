import { jsx as _jsx } from "react/jsx-runtime";
const StreakIcon = ({ className = '' }) => {
    return (_jsx("img", { src: "/assets/streak.png", alt: "Streak", className: `w-32 h-32 mt-4 -ml-4 ${className}` }));
};
export default StreakIcon;
