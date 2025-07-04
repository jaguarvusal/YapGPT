import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ADD_YAPPER, LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import passwordIcon from "/assets/password.png";
import welcomeImage from "/assets/welcome.png";
import welcomebackImage from "/assets/welcomeback.png";
const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        password: '',
        identifier: '',
    });
    const [error, setError] = useState('');
    const [showError, setShowError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [activeForm, setActiveForm] = useState('signup');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
    });
    const [passwordError, setPasswordError] = useState('');
    const [addYapper, { error: signupError }] = useMutation(ADD_YAPPER);
    const [login, { error: loginError }] = useMutation(LOGIN_USER);
    useEffect(() => {
        // Trigger fade in on mount
        setIsVisible(true);
    }, []);
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
        if (name === 'password') {
            setPasswordCriteria({
                length: value.length >= 8,
                lowercase: /[a-z]/.test(value),
                uppercase: /[A-Z]/.test(value),
            });
        }
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
                variables: { ...formState },
            });
            if (data?.addYapper?.token) {
                Auth.login(data.addYapper.token);
                navigate('/me');
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
                navigate('/me');
            }
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleExit = () => {
        setIsVisible(false);
        setTimeout(() => {
            navigate(-1);
        }, 300); // Match this with the animation duration
    };
    return (_jsxs("div", { className: `flex min-h-screen bg-[#f3e0b7] transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: [_jsx("div", { className: "hidden lg:flex w-1/2 items-center justify-center p-8", children: _jsx("img", { src: activeForm === 'signup' ? welcomeImage : welcomebackImage, alt: "Welcome", className: "w-full max-w-6xl object-contain translate-x-16 border-[16px] border-black rounded-3xl" }) }), _jsxs("div", { className: "w-full lg:w-1/2 flex items-center justify-center p-4 relative", children: [_jsx("button", { onClick: handleExit, className: "absolute top-8 right-8 text-gray-600 hover:text-gray-800 text-3xl font-bold transition-colors duration-150 z-10", children: "\u2715" }), _jsxs("div", { className: "bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-8 max-w-md w-full mx-4 relative shadow-lg border-4 border-[#17475c]", children: [_jsx("h1", { className: "text-2xl font-bold text-center mb-8 text-black", children: activeForm === 'signup'
                                    ? 'Create a Profile to Add Friends, compete, and more!'
                                    : 'Login to view your friends, compete, and more!' }), _jsxs("div", { className: "flex space-x-4 mb-6", children: [_jsx("button", { onClick: () => setActiveForm('signup'), className: `flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${activeForm === 'signup'
                                            ? 'bg-[#e15831] text-white border-[#b34426]'
                                            : 'bg-[#e15831] text-white border-[#b34426]'}`, children: "SIGN UP" }), _jsx("button", { onClick: () => setActiveForm('login'), className: `flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center border-b-4 ${activeForm === 'login'
                                            ? 'bg-[#17475c] text-white border-[#123a4c]'
                                            : 'bg-[#17475c] text-white border-[#123a4c]'}`, children: "LOG IN" })] }), _jsxs("div", { className: `${activeForm === 'signup' ? 'bg-[#e15831]' : 'bg-[#17475c]'} rounded-lg p-6 text-white relative`, children: [_jsx("div", { className: `transition-all duration-300 ease-in-out ${activeForm === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`, children: _jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "name", placeholder: "Name", value: formState.name, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsx("div", { children: _jsx("input", { type: "email", name: "email", placeholder: "Email", value: formState.email, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, onFocus: () => setShowPasswordTooltip(true), onBlur: (e) => {
                                                                if (!e.relatedTarget?.closest('button[type="submit"]')) {
                                                                    setShowPasswordTooltip(false);
                                                                }
                                                            }, className: "w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), showPasswordTooltip && (_jsx("div", { className: "relative w-full bg-gray-800 rounded-lg shadow-lg p-4 border-2 border-gray-600 z-50", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: `text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.length ? '✓' : '○', " 8+ Characters"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.lowercase ? '✓' : '○', " At least one lowercase letter"] }), _jsxs("p", { className: `text-sm ${passwordCriteria.uppercase ? 'text-green-500' : 'text-gray-400'}`, children: [passwordCriteria.uppercase ? '✓' : '○', " At least one uppercase letter"] })] }) })), passwordError && (_jsx("p", { className: "text-red-800 text-sm", children: passwordError })), signupError && (_jsx("p", { className: "text-red-500 text-sm", children: signupError.message === '[function AuthenticationError]'
                                                        ? 'Invalid email or password'
                                                        : signupError.message })), _jsx("button", { type: "submit", className: "w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "START YAPPING!" })] }) }), _jsx("div", { className: `transition-all duration-300 ease-in-out ${activeForm === 'login' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 absolute'}`, children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsx("div", { children: _jsx("input", { type: "text", name: "identifier", placeholder: "Email or Username", value: formState.identifier, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" }) }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", name: "password", placeholder: "Password", value: formState.password, onChange: handleChange, className: "w-full px-4 py-2 rounded-lg bg-[#e15831] text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800", children: _jsx("img", { src: passwordIcon, alt: "Toggle password visibility", className: `w-8 h-8 transition-opacity ${showPassword ? 'opacity-50' : 'opacity-100'}` }) })] }), loginError && (_jsx("p", { className: "text-red-500 text-sm", children: loginError.message === '[function AuthenticationError]'
                                                        ? 'Invalid email or password'
                                                        : loginError.message })), _jsx("button", { type: "submit", className: "w-full bg-white text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 uppercase font-medium", children: "START YAPPING!" })] }) })] })] })] })] }));
};
export default AuthPage;
