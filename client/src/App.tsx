// import './App.css';
import React from 'react';
import { Outlet, useLocation, Routes, Route } from 'react-router-dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import Sidebar from './components/Sidebar.tsx';
import RightSidebar from './components/RightSidebar.tsx';
import LeaderboardsSidebar from './components/LeaderboardsSidebar.tsx';
import ProfileSidebar from './components/ProfileSidebar.tsx';
import StreakPopup from './components/StreakPopup.tsx';
import Auth from './utils/auth';
import SearchFriends from './pages/SearchFriends';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AuthPage from './pages/Auth';
import Leaderboards from './components/Leaderboards';
import Flirt from './pages/Flirt';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001/graphql',
  credentials: 'include'
});

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('id_token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  // Set up our client to execute the `authLink` middleware prior to making the request to our GraphQL API
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App: React.FC = () => {
  const location = useLocation();
  const isLeaderboardsPage = location.pathname === '/leaderboards';
  const isAuthPage = location.pathname === '/auth';
  const isFlirtPage = location.pathname === '/flirt';
  const isSearchFriendsPage = location.pathname === '/search-friends';
  const isProfilePage = location.pathname === '/me' || location.pathname.startsWith('/profile/');
  const isAvatarPage = location.pathname === '/avatar';
  const isLoggedIn = Auth.loggedIn();

  console.log('App Debug Info:', {
    currentPath: location.pathname,
    isLeaderboardsPage,
    isAuthPage,
    isFlirtPage,
    isSearchFriendsPage,
    isProfilePage,
    isAvatarPage,
    isLoggedIn,
    token: localStorage.getItem('id_token')
  });

  const renderSidebar = () => {
    if (isLeaderboardsPage) {
      return <LeaderboardsSidebar />;
    }
    if (isProfilePage && isLoggedIn) {
      return <ProfileSidebar />;
    }
    return <RightSidebar />;
  };

  return (
    <ApolloProvider client={client}>
      <div className="flex w-full h-screen bg-[#f3e0b7]">
        {/* Left Sidebar */}
        {!isAuthPage && (
          <div className="hidden md:flex w-64 bg-[#17475c] text-black flex-col py-4 pl-6 fixed left-0 top-0 h-full border-r-4 border-dashed border-gray-700 z-10">
            <div className="sticky top-0">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${!isAuthPage ? (isFlirtPage ? 'md:ml-64' : isSearchFriendsPage ? 'md:ml-64' : isAvatarPage ? 'md:ml-64' : 'md:ml-64 lg:mr-[450px]') : ''} bg-[#f3e0b7] h-screen`}>
          <div id="scroll-container" className="h-full overflow-y-auto overscroll-contain hide-scrollbar">
            <Outlet />
          </div>
        </div>

        {/* Right Sidebar */}
        {!isAuthPage && !isFlirtPage && !isSearchFriendsPage && !isAvatarPage && (
          <div className="hidden md:block w-[450px] p-4 bg-[#f3e0b7] fixed right-0 top-0 h-full z-10">
            <div id="right-sidebar-scroll" className="h-full overflow-y-auto hide-scrollbar">
              {renderSidebar()}
            </div>
          </div>
        )}
        <StreakPopup />
      </div>
    </ApolloProvider>
  );
};

export default App;
