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
import MobileNav from './components/MobileNav.tsx';
import MobileTopBar from './components/MobileTopBar.tsx';
import Auth from './utils/auth';
import SearchFriends from './pages/SearchFriends';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AuthPage from './pages/Auth';
import Leaderboards from './components/Leaderboards';
import Flirt from './pages/Flirt';
import { useStreak } from './contexts/StreakContext';
import { useHearts } from './contexts/HeartsContext';

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
  const { streak } = useStreak();
  const { hearts } = useHearts();
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
      <div className="flex w-full h-screen bg-[#f3e0b7] overflow-x-hidden">
        {/* Mobile Top Bar - Only visible on yap page */}
        {!isAuthPage && <MobileTopBar hearts={hearts} streak={streak} isVisible={location.pathname === '/'} />}

        {/* Left Sidebar - Hidden on mobile */}
        {!isAuthPage && (
          <div className="hidden md:flex w-64 bg-[#17475c] text-black flex-col py-4 pl-6 fixed left-0 top-0 h-full border-r-4 border-dashed border-gray-700 z-[1]">
            <div className="sticky top-0">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${
          !isAuthPage 
            ? (isFlirtPage 
                ? 'md:ml-64' 
                : isSearchFriendsPage 
                  ? 'md:ml-64' 
                  : isAvatarPage 
                    ? 'md:ml-64' 
                    : 'md:ml-64 lg:mr-[450px]'
              ) 
            : ''
        } bg-[#f3e0b7] h-screen pb-16 md:pb-0 overflow-x-hidden max-w-[100vw] relative z-[1]`}>
          <div id="scroll-container" className="h-full overflow-y-auto overflow-x-hidden overscroll-contain hide-scrollbar w-full pt-12 md:pt-0">
            <Outlet />
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        {!isAuthPage && !isFlirtPage && !isSearchFriendsPage && !isAvatarPage && (
          <div className="hidden md:block w-[450px] p-4 bg-[#f3e0b7] fixed right-0 top-0 h-full z-0">
            <div id="right-sidebar-scroll" className="h-full overflow-y-auto hide-scrollbar">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Mobile Navigation - Only visible on mobile and not on auth page */}
        {!isAuthPage && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[200]">
            <MobileNav />
          </div>
        )}
        
        <StreakPopup />
      </div>

      {/* Global Modal Container */}
      <div id="modal-root" className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        <div id="modal-backdrop" className="fixed inset-0 bg-black/50 pointer-events-auto" style={{ display: 'none' }}></div>
        <div id="modal-content" className="fixed inset-0 flex items-center justify-center pointer-events-auto" style={{ display: 'none' }}></div>
      </div>
    </ApolloProvider>
  );
};

export default App;
