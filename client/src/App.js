import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, useLocation } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Sidebar from './components/Sidebar.tsx';
import RightSidebar from './components/RightSidebar.tsx';
import LeaderboardsSidebar from './components/LeaderboardsSidebar.tsx';
import StreakPopup from './components/StreakPopup.tsx';
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
const App = () => {
    const location = useLocation();
    const isLeaderboardsPage = location.pathname === '/leaderboards';
    const isAuthPage = location.pathname === '/auth';
    const isFlirtPage = location.pathname === '/flirt';
    return (_jsx(ApolloProvider, { client: client, children: _jsxs("div", { className: "flex w-full h-screen bg-[#f3e0b7]", children: [!isAuthPage && (_jsx("div", { className: "hidden md:flex w-64 bg-[#17475c] text-black flex-col py-4 pl-6 fixed left-0 top-0 h-full border-r-4 border-dashed border-gray-700 z-10", children: _jsx("div", { className: "sticky top-0", children: _jsx(Sidebar, {}) }) })), _jsx("div", { className: `flex-1 ${!isAuthPage ? (isFlirtPage ? 'md:ml-64' : 'md:ml-64 lg:mr-[450px]') : ''} bg-[#f3e0b7] h-screen`, children: _jsx("div", { id: "scroll-container", className: "h-full overflow-y-auto overscroll-contain hide-scrollbar", children: _jsx(Outlet, {}) }) }), !isAuthPage && !isFlirtPage && (_jsx("div", { className: "hidden md:block w-[450px] p-4 bg-[#f3e0b7] fixed right-0 top-0 h-full z-10", children: _jsx("div", { id: "right-sidebar-scroll", className: "h-full overflow-y-auto hide-scrollbar", children: isLeaderboardsPage ? _jsx(LeaderboardsSidebar, {}) : _jsx(RightSidebar, {}) }) })), _jsx(StreakPopup, {})] }) }));
};
export default App;
