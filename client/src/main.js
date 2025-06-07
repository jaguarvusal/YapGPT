import { jsx as _jsx } from "react/jsx-runtime";
import './index.css';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { HeartsProvider } from './contexts/HeartsContext';
import { StreakProvider } from './contexts/StreakContext';
import App from './App.jsx';
import Dashboard from './components/Dashboard';
import Profile from './pages/Profile';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Error from './pages/Error';
import Lesson from './components/Lesson';
import LessonLayout from './components/LessonLayout';
import Leaderboards from './components/Leaderboards';
import Auth from './pages/Auth';
import Flirt from './pages/Flirt';
const httpLink = new HttpLink({
    uri: 'http://localhost:3001/graphql',
    credentials: 'include',
});
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('id_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});
// Add error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
        console.error('GraphQL Errors:', graphQLErrors);
        console.error('Operation:', operation);
    }
    if (networkError) {
        console.error('Network Error:', networkError);
        console.error('Operation:', operation);
    }
});
const client = new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});
const router = createBrowserRouter([
    {
        path: "/",
        element: _jsx(App, {}),
        errorElement: _jsx(Error, {}),
        children: [
            {
                index: true,
                element: _jsx(Dashboard, {})
            }, {
                path: '/login',
                element: _jsx(Login, {})
            }, {
                path: '/signup',
                element: _jsx(Signup, {})
            }, {
                path: '/profiles/:profileId',
                element: _jsx(Profile, {})
            }, {
                path: '/me',
                element: _jsx(Profile, {})
            }, {
                path: '/leaderboards',
                element: _jsx(Leaderboards, {})
            }, {
                path: '/auth',
                element: _jsx(Auth, {})
            }, {
                path: 'flirt',
                element: _jsx(Flirt, {})
            }
        ]
    },
    {
        path: '/unit',
        element: _jsx(LessonLayout, {}),
        children: [
            {
                path: ':unitId/lesson/:levelId',
                element: _jsx(Lesson, {})
            }
        ]
    }
]);
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(_jsx(ApolloProvider, { client: client, children: _jsx(HeartsProvider, { children: _jsx(StreakProvider, { children: _jsx(RouterProvider, { router: router }) }) }) }));
}
