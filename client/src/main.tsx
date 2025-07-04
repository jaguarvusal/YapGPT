import './index.css';
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { HeartsProvider } from './contexts/HeartsContext.jsx';
import { StreakProvider } from './contexts/StreakContext';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';

import App from './App.tsx';
import Dashboard from './components/Dashboard';
import Profile from './pages/Profile.tsx';
import Signup from './pages/Signup.tsx';
import Login from './pages/Login.tsx';
import Error from './pages/Error.tsx';
import Lesson from './components/Lesson.tsx';
import LessonLayout from './components/LessonLayout.tsx';
import Leaderboards from './components/Leaderboards.tsx';
import Auth from './pages/Auth.tsx';
import Flirt from './pages/Flirt.tsx';
import SearchFriends from './pages/SearchFriends';
import Avatar from './pages/Avatar';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001/graphql',
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
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Dashboard />
      }, {
        path: 'login',
        element: <Login />
      }, {
        path: 'signup',
        element: <Signup />
      }, {
        path: 'profile/:yapperId',
        element: <Profile />
      }, {
        path: 'me',
        element: <Profile />
      }, {
        path: 'leaderboards',
        element: <Leaderboards />
      }, {
        path: 'auth',
        element: <Auth />
      }, {
        path: 'flirt',
        element: <Flirt />
      }, {
        path: 'search-friends',
        element: <SearchFriends />
      }, {
        path: 'avatar',
        element: <Avatar />
      }
    ]
  },
  {
    path: '/unit',
    element: <LessonLayout />,
    children: [
      {
        path: ':unitId/lesson/:levelId',
        element: <Lesson />
      }
    ]
  }
]);

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <ApolloProvider client={client}>
      <HeartsProvider>
        <StreakProvider>
          <RouterProvider router={router} />
        </StreakProvider>
      </HeartsProvider>
    </ApolloProvider>
  );
}
