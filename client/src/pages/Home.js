import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@apollo/client';
import { QUERY_YAPPERS } from '../utils/queries';
import SplashScreen from '../components/SplashScreen.tsx';
const Home = () => {
    const { loading, data } = useQuery(QUERY_YAPPERS);
    const yappers = data?.yappers || [];
    if (loading) {
        return _jsx(SplashScreen, {});
    }
    return (_jsx("main", { children: _jsx("div", { children: _jsx("div", { children: _jsxs("h3", { children: ["There are ", yappers.length, " users."] }) }) }) }));
};
export default Home;
