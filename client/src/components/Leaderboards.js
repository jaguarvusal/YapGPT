import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from '/assets/password.png';
import leaderboardPreview from '/assets/leaderboardpreview.png';
const Leaderboards = () => {
    const [activeForm, setActiveForm] = useState(null);
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
    const formRef = useRef(null);
    const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
    const [login, { error: loginError }] = useMutation(LOGIN_USER);
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
    const handleFormToggle = (form) => {
        setActiveForm(activeForm === form ? null : form);
        // Scroll to form after a short delay to ensure it's rendered
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
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
                setFormState({ name: '', email: '', password: '', identifier: '' });
                setPasswordError('');
                setShowPasswordTooltip(false);
                setShowPassword(false);
                // Then login and hide signup form
                Auth.login(data.addYapper.token);
                setActiveForm(null);
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
                setActiveForm(null);
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    return (_jsxs("div", { className: "flex-1 flex flex-col items-center pt-4", children: [_jsx("img", { src: "/assets/medals.png", alt: "Medals", className: "w-64 h-auto mb-2" }), _jsx("h1", { className: "text-3xl font-bold text-black mb-1", children: "Unlock Leaderboards!" }), _jsx("p", { className: "text-gray-600 text-base mb-4", children: "Create an account or login to start competing" }), _jsxs("div", { className: "flex space-x-3 w-80", children: [_jsx("button", { onClick: () => handleFormToggle('signup'), className: "w-1/2 bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Sign Up" }), _jsx("button", { onClick: () => handleFormToggle('login'), className: "w-1/2 bg-[#17475c] text-white py-2 px-4 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Log In" })] }), activeForm === 'signup' && (_jsxs("div", { ref: formRef, className: "mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-80 border-4 border-dashed border-[#17475c] animate-fadeIn", children: [_jsx("h2", { className: "text-lg font-semibold mb-6 text-black", children: "Create a Profile" }), _jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "name", placeholder: "Name", value: formState.name, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsx("div", { children: _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formState.email, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, onFocus: () => {
                                            setShowPasswordTooltip(true);
                                        }, onBlur: (e) => {
                                            // Only hide tooltip if we're not clicking the submit button
                                            if (!e.relatedTarget?.closest('button[type="submit"]')) {
                                                setShowPasswordTooltip(false);
                                            }
                                        }, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), showPasswordTooltip && (_jsx("div", { className: "relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50 mb-32", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: `text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.length ? '✓' : '○', " 8+ Characters"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.lowercase ? '✓' : '○', " At least one lowercase letter"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.uppercase ? '✓' : '○', " At least one uppercase letter"] })] }) })), passwordError && (_jsx("p", { className: "text-red-500 text-sm", children: passwordError })), signupError && (_jsx("p", { className: "text-red-500 text-sm", children: signupError.message })), _jsx("button", { type: "submit", className: "w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Create Account" })] })] })), activeForm === 'login' && (_jsxs("div", { ref: formRef, className: "mt-4 bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl shadow-md p-4 w-80 border-4 border-dashed border-[#17475c] animate-fadeIn", children: [_jsx("h2", { className: "text-lg font-semibold mb-6 text-black", children: "Log In" }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "identifier", placeholder: "Email or Username", value: formState.identifier, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), loginError && (_jsx("p", { className: "text-red-500 text-sm", children: loginError.message })), _jsx("button", { type: "submit", className: "w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all duration-150 text-center border-b-4 border-purple-600 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "Log In" })] })] })), _jsx("img", { src: leaderboardPreview, alt: "Leaderboard Preview", className: "w-[400px] h-auto mt-4" })] }));
};
export default Leaderboards;
