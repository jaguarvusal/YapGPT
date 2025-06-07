import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from '../assets 2/password.png';
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedButton, setSelectedButton] = useState(() => {
        if (location.pathname === '/leaderboards')
            return 'leaderboard';
        if (location.pathname === '/flirt')
            return 'flirt';
        return 'yap';
    });
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [activeForm, setActiveForm] = useState('signup');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        password: '',
        identifier: '',
    });
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
    });
    const [passwordError, setPasswordError] = useState('');
    const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
    const [login, { error: loginError }] = useMutation(LOGIN_USER);
    const handleNavigation = (path, button) => {
        navigate(path);
        setSelectedButton(button);
    };
    const handleProfileClick = () => {
        if (!Auth.loggedIn()) {
            navigate('/auth');
            setSelectedButton('profile');
        }
        else {
            navigate('/me');
        }
    };
    useEffect(() => {
        if (location.pathname === '/leaderboards') {
            setSelectedButton('leaderboard');
        }
        else if (location.pathname === '/flirt') {
            setSelectedButton('flirt');
        }
        else if (location.pathname === '/') {
            setSelectedButton('yap');
        }
    }, [location.pathname]);
    useEffect(() => {
        const password = formState.password;
        const newCriteria = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
        };
        setPasswordCriteria(newCriteria);
        if (password && !Object.values(newCriteria).every(Boolean)) {
            const missingCriteria = [];
            if (!newCriteria.length)
                missingCriteria.push('8+ characters');
            if (!newCriteria.lowercase)
                missingCriteria.push('lowercase letter');
            if (!newCriteria.uppercase)
                missingCriteria.push('uppercase letter');
            setPasswordError(`Password must contain: ${missingCriteria.join(', ')}`);
        }
        else {
            setPasswordError('');
        }
    }, [formState.password]);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState({
            ...formState,
            [name]: value,
        });
    };
    const handleSignup = async (event) => {
        event.preventDefault();
        if (!Object.values(passwordCriteria).every(Boolean)) {
            setPasswordError('Please meet all password requirements');
            return;
        }
        try {
            const { data } = await addYapper({
                variables: { input: { ...formState } },
            });
            if (data?.addYapper?.token) {
                setFormState({ name: '', email: '', password: '', identifier: '' });
                setPasswordError('');
                setShowPasswordTooltip(false);
                setShowPassword(false);
                Auth.login(data.addYapper.token);
                setShowAuthPopup(false);
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const { data } = await login({
                variables: {
                    identifier: formState.identifier,
                    password: formState.password
                },
            });
            if (data?.login?.token) {
                Auth.login(data.login.token);
                setShowAuthPopup(false);
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "flex items-center justify-center", children: _jsx("img", { src: "/src/assets 2/logo.png", alt: "YapGPT Logo", className: "w-40 h-40" }) }) }), _jsx("div", { className: "mt-10", children: _jsxs("div", { className: "flex flex-col w-full", children: [_jsx("div", { className: "mb-4 w-full", children: _jsx("button", { className: `w-[90%] rounded-xl transition-all duration-150 group ${selectedButton === 'yap'
                                    ? 'bg-[#f3e0b7] border-2 border-[#e15831]'
                                    : ''}`, "aria-label": "Yap", onClick: () => handleNavigation('/', 'yap'), children: _jsxs("div", { className: `flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${selectedButton !== 'yap' ? 'group-hover:bg-[#f3e0b7]' : ''}`, children: [_jsx("span", { className: "w-16 h-16", children: _jsx("img", { src: "/src/assets 2/yap.png", alt: "Yap", className: "w-full h-full object-contain" }) }), _jsx("span", { className: `text-sm font-medium ${selectedButton === 'yap'
                                                ? 'text-[#e15831]'
                                                : 'text-white group-hover:text-[#17475c]'}`, children: "YAP" })] }) }) }), _jsx("div", { className: "mb-4 w-full", children: _jsx("button", { className: `w-[90%] rounded-xl transition-all duration-150 group ${selectedButton === 'leaderboard'
                                    ? 'bg-[#f3e0b7] border-2 border-[#e15831]'
                                    : ''}`, "aria-label": "Leaderboard", onClick: () => handleNavigation('/leaderboards', 'leaderboard'), children: _jsxs("div", { className: `flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${selectedButton !== 'leaderboard' ? 'group-hover:bg-[#f3e0b7]' : ''}`, children: [_jsx("span", { className: "w-16 h-16", children: _jsx("img", { src: "/src/assets 2/leaderboards.png", alt: "Leaderboard", className: "w-full h-full object-contain" }) }), _jsx("span", { className: `text-sm font-medium ${selectedButton === 'leaderboard'
                                                ? 'text-[#e15831]'
                                                : 'text-white group-hover:text-[#17475c]'}`, children: "LEADERBOARD" })] }) }) }), _jsx("div", { className: "mb-4 w-full", children: _jsx("button", { className: `w-[90%] rounded-xl transition-all duration-150 group ${selectedButton === 'flirt'
                                    ? 'bg-[#f3e0b7] border-2 border-[#e15831]'
                                    : ''}`, "aria-label": "Flirt", onClick: () => handleNavigation('/flirt', 'flirt'), children: _jsxs("div", { className: `flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${selectedButton !== 'flirt' ? 'group-hover:bg-[#f3e0b7]' : ''}`, children: [_jsx("span", { className: "w-16 h-16", children: _jsx("img", { src: "/src/assets 2/flirt.png", alt: "Flirt", className: "w-full h-full object-contain" }) }), _jsx("span", { className: `text-sm font-medium ${selectedButton === 'flirt'
                                                ? 'text-[#e15831]'
                                                : 'text-white group-hover:text-[#17475c]'}`, children: "FLIRT" })] }) }) }), _jsx("div", { className: "w-full", children: _jsx("button", { className: `w-[90%] rounded-xl transition-all duration-150 group relative ${selectedButton === 'profile'
                                    ? 'bg-[#f3e0b7] border-2 border-[#e15831]'
                                    : ''}`, "aria-label": "Profile", onClick: handleProfileClick, children: _jsxs("div", { className: `flex items-center space-x-4 text-2xl px-2 py-3 rounded-xl ${selectedButton !== 'profile' ? 'group-hover:bg-[#f3e0b7]' : ''}`, children: [_jsxs("span", { className: "w-16 h-16 relative", children: [_jsx("div", { className: "absolute -top-1 right-1 w-3 h-3 bg-red-500 rounded-full" }), _jsx("img", { src: "/src/assets 2/profile.png", alt: "Profile", className: "w-full h-full object-contain" })] }), _jsx("span", { className: `text-sm font-medium ${selectedButton === 'profile'
                                                ? 'text-[#e15831]'
                                                : 'text-white group-hover:text-[#17475c]'}`, children: "PROFILE" })] }) }) })] }) }), showAuthPopup && (_jsx("div", { className: "fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[2000]", children: _jsxs("div", { className: "bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 relative", children: [_jsx("button", { onClick: () => setShowAuthPopup(false), className: "absolute top-4 right-4 text-gray-600 hover:text-gray-800", children: "\u2715" }), _jsx("p", { className: "text-black text-center mb-6 text-xl font-bold", children: activeForm === 'signup'
                                ? 'Create a Profile to Add Friends, compete, and more!'
                                : 'Login in to view your friends, compete, and more!' }), _jsxs("div", { className: "flex space-x-4 mb-6", children: [_jsx("button", { onClick: () => setActiveForm('signup'), className: `flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${activeForm === 'signup'
                                        ? 'bg-[#e15831] text-white border-[#b34426]'
                                        : 'bg-[#e15831] text-white border-[#b34426]'}`, children: "Sign Up" }), _jsx("button", { onClick: () => setActiveForm('login'), className: `flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${activeForm === 'login'
                                        ? 'bg-[#17475c] text-white border-[#123a4c]'
                                        : 'bg-[#17475c] text-white border-[#123a4c]'}`, children: "Log In" })] }), _jsx("div", { className: `${activeForm === 'signup' ? 'bg-[#e15831]' : 'bg-[#17475c]'} rounded-lg p-6 text-white`, children: activeForm === 'signup' ? (_jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "name", placeholder: "Name", value: formState.name, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsx("div", { children: _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formState.email, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, onFocus: () => setShowPasswordTooltip(true), onBlur: (e) => {
                                                    if (!e.relatedTarget?.closest('button[type="submit"]')) {
                                                        setShowPasswordTooltip(false);
                                                    }
                                                }, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), showPasswordTooltip && (_jsx("div", { className: "relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: `text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.length ? '✓' : '○', " 8+ Characters"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.lowercase ? '✓' : '○', " At least one lowercase letter"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.uppercase ? '✓' : '○', " At least one uppercase letter"] })] }) })), passwordError && (_jsx("p", { className: "text-red-500 text-sm", children: passwordError })), signupError && (_jsx("p", { className: "text-red-500 text-sm", children: signupError.message })), _jsx("button", { type: "submit", className: "w-full bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Create Account" })] })) : (_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "identifier", placeholder: "Email or Username", value: formState.identifier, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), loginError && (_jsx("p", { className: "text-red-500 text-sm", children: loginError.message === '[function AuthenticationError]'
                                            ? 'Invalid email or password'
                                            : loginError.message })), _jsx("button", { type: "submit", className: "w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Log In" })] })) })] }) }))] }));
};
export default Sidebar;
