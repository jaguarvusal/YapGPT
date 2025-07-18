import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import Hearts from './Hearts.tsx';
import { useStreak } from '../contexts/StreakContext';
import StreakIcon from './StreakIcon.tsx';
import passwordIcon from '/assets/password.png';
const RightSidebar = () => {
    const { streak } = useStreak();
    const [showSignup, setShowSignup] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
    });
    const [passwordError, setPasswordError] = useState('');
    const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
    const [login, { error: loginError }] = useMutation(LOGIN_USER);
    const scrollToForm = () => {
        const formElement = document.getElementById('auth-form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };
    const handleShowSignup = () => {
        setShowSignup(true);
        setShowLogin(false);
        setTimeout(scrollToForm, 100); // Small delay to ensure the form is rendered
    };
    const handleShowLogin = () => {
        setShowLogin(true);
        setShowSignup(false);
        setTimeout(scrollToForm, 100); // Small delay to ensure the form is rendered
    };
    useEffect(() => {
        const password = formState.password;
        const newCriteria = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
        };
        setPasswordCriteria(newCriteria);
        // Set error message if password doesn't meet criteria
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
        // Check if password meets all criteria
        if (!Object.values(passwordCriteria).every(Boolean)) {
            setPasswordError('Please meet all password requirements');
            return;
        }
        try {
            const { data } = await addYapper({
                variables: { input: { ...formState } },
            });
            if (data?.addYapper?.token) {
                // Clear all states first
                setFormState({ name: '', email: '', password: '' });
                setPasswordError('');
                setShowPasswordTooltip(false);
                setShowPassword(false);
                // Then login and hide signup form
                Auth.login(data.addYapper.token);
                setShowSignup(false);
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            console.log('Attempting login with:', { identifier: formState.email, password: formState.password });
            const { data } = await login({
                variables: {
                    identifier: formState.email,
                    password: formState.password
                },
            });
            if (data?.login?.token) {
                Auth.login(data.login.token);
                setShowLogin(false);
                setFormState({ name: '', email: '', password: '' });
            }
        }
        catch (e) {
            console.error('Login error:', e);
            // The error message will be displayed in the UI through the loginError state
        }
    };
    const formatJoinDate = () => {
        const profile = Auth.getProfile();
        if (profile?.data) {
            const date = new Date();
            return `Joined in ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        }
        return '';
    };
    return (_jsxs("div", { className: "flex flex-col space-y-2", children: [_jsxs("div", { className: "flex flex-col space-y-4", children: [_jsxs("div", { className: "bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-4 shadow-lg border-4 border-[#17475c]", children: [_jsx("h2", { className: "text-lg font-semibold text-black mb-2", children: "Lives" }), _jsx("div", { className: "flex justify-center", children: _jsx(Hearts, {}) })] }), _jsxs("div", { className: "bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-4 pb-0 shadow-lg border-4 border-[#17475c]", children: [_jsx("h2", { className: "text-lg font-semibold text-black mb-2", children: "Streak" }), _jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(StreakIcon, { className: "text-orange-500" }), _jsxs("div", { className: "flex items-center -mt-32 -ml-12", children: [_jsx("span", { className: "text-3xl font-medium text-orange-500 mr-2", children: "Day" }), _jsx("span", { className: "text-6xl font-semibold text-orange-500", children: streak })] })] }) })] })] }), _jsx("div", { className: "sticky top-0 bg-[#f3e0b7]/80 backdrop-blur-md pt-4 pb-2 z-20", children: _jsx("div", { className: "flex items-center justify-center space-x-8" }) }), _jsx("div", { className: "mt-0 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c]", children: Auth.loggedIn() ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-lg font-semibold mb-2 text-white", children: Auth.getProfile().data.username }), _jsx("p", { className: "text-gray-400 text-sm mb-6", children: formatJoinDate() }), _jsxs("div", { className: "space-y-3", children: [_jsx(Link, { to: "/me", className: "block w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0", children: "View Profile" }), _jsx("button", { onClick: () => Auth.logout(), className: "w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 border-b-4 border-gray-200 active:translate-y-1 active:border-b-0", children: "Log Out" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-lg font-semibold mb-6 text-black", children: "Create a profile to save your progress!" }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleShowSignup, className: "block w-full bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Sign Up" }), _jsx("button", { onClick: handleShowLogin, className: "block w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Log In" })] })] })) }), showSignup && (_jsxs("div", { id: "auth-form", className: "mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c] animate-fadeIn", children: [_jsx("h2", { className: "text-lg font-semibold mb-6 text-black", children: "Create a Profile" }), _jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "name", placeholder: "Name", value: formState.name, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsx("div", { children: _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formState.email, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, onFocus: () => {
                                            setShowPasswordTooltip(true);
                                        }, onBlur: (e) => {
                                            // Only hide tooltip if we're not clicking the submit button
                                            if (!e.relatedTarget?.closest('button[type="submit"]')) {
                                                setShowPasswordTooltip(false);
                                            }
                                        }, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), showPasswordTooltip && (_jsx("div", { className: "relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50 mb-32", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: `text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.length ? '✓' : '○', " 8+ Characters"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.lowercase ? '✓' : '○', " At least one lowercase letter"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.uppercase ? '✓' : '○', " At least one uppercase letter"] })] }) })), passwordError && (_jsx("p", { className: "text-red-500 text-sm", children: passwordError })), signupError && (_jsx("p", { className: "text-red-500 text-sm", children: signupError.message })), _jsx("div", { children: _jsx("button", { type: "submit", className: "w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Create Account" }) })] })] })), showLogin && (_jsxs("div", { id: "auth-form", className: "mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 max-w-[350px] border-4 border-dashed border-[#17475c] animate-fadeIn", children: [_jsx("h2", { className: "text-lg font-semibold mb-6 text-black", children: "Log In" }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "email", placeholder: "Email or Username", value: formState.email, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), loginError && (_jsx("p", { className: "text-red-500 text-sm mt-2", children: loginError.message === '[function AuthenticationError]'
                                    ? 'Invalid email or password'
                                    : loginError.message })), _jsx("button", { type: "submit", className: "w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Log In" })] })] }))] }));
};
export default RightSidebar;
