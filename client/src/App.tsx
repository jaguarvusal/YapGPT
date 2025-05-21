// import './App.css';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { Outlet } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RightSidebar from './components/RightSidebar';

const httpLink = createHttpLink({
  uri: '/graphql',
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

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="flex w-full h-screen bg-gray-800">
        {/* Left Sidebar */}
        <div className="hidden md:flex w-64 bg-gray-800 text-black flex-col py-4 pl-6 fixed left-0 top-0 h-full border-r border-gray-700">
          <Sidebar />
        </div>

        {/* Main Content Area with Dashboard */}
        <div className="flex-1 md:ml-64 lg:mr-[450px] bg-gray-800">
          <Dashboard />
        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block w-[450px] border-l border-gray-700 p-4 bg-gray-800 fixed right-0 top-0 h-full">
          <RightSidebar />
        </div>
      </div>
    </ApolloProvider>
  );
}

export default App;
