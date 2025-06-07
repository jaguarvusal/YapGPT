import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';
const Login = () => {
    const [formState, setFormState] = useState({ email: '', password: '' });
    const [login, { error, data }] = useMutation(LOGIN_USER);
    // update state based on form input changes
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormState({
            ...formState,
            [name]: value,
        });
    };
    // submit form
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        console.log(formState);
        try {
            const { data } = await login({
                variables: { ...formState },
            });
            Auth.login(data.login.token);
        }
        catch (e) {
            console.error(e);
        }
        // clear form values
        setFormState({
            email: '',
            password: '',
        });
    };
    return (_jsx("main", { children: _jsx("div", { children: _jsxs("div", { children: [_jsx("h4", { children: "Login" }), _jsxs("div", { children: [data ? (_jsxs("p", { children: ["Success! You may now head", ' ', _jsx(Link, { to: "/", children: "back to the homepage." })] })) : (_jsxs("form", { onSubmit: handleFormSubmit, children: [_jsx("input", { placeholder: "Your email", name: "email", type: "email", value: formState.email, onChange: handleChange }), _jsx("input", { placeholder: "******", name: "password", type: "password", value: formState.password, onChange: handleChange }), _jsx("button", { style: { cursor: 'pointer' }, type: "submit", children: "Submit" })] })), error && (_jsx("div", { children: error.message }))] })] }) }) }));
};
export default Login;
