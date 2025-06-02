// import './App.css';
import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import StreakPopup from './components/StreakPopup';

const httpLink = createHttpLink({
  uri: 'http://localhost:3001/graphql',
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
  return (
    <ApolloProvider client={client}>
      <div className="flex w-full h-screen bg-[#f3e0b7]">
        {/* Left Sidebar */}
        <div className="hidden md:flex w-64 bg-[#17475c] text-black flex-col py-4 pl-6 fixed left-0 top-0 h-full border-r-4 border-dashed border-gray-700 z-10">
          <div className="sticky top-0">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 lg:mr-[450px] bg-[#f3e0b7] h-screen">
          <div id="scroll-container" className="h-full overflow-y-auto overscroll-contain hide-scrollbar">
            <Outlet />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block w-[450px] p-4 bg-[#f3e0b7] fixed right-0 top-0 h-full z-10">
          <div id="right-sidebar-scroll" className="h-full overflow-y-auto hide-scrollbar">
            <RightSidebar />
          </div>
        </div>

        {/* Streak Popup */}
        <StreakPopup />
      </div>
    </ApolloProvider>
  );
};

export default App;
