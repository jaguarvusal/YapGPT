import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { QUERY_SINGLE_YAPPER, QUERY_ME } from '../utils/queries';
import Auth from '../utils/auth';
import SplashScreen from '../components/SplashScreen.tsx';
const Profile = () => {
    const { yapperId } = useParams();
    // If there is no `yapperId` in the URL as a parameter, execute the `QUERY_ME` query instead for the logged in user's information
    const { loading, data } = useQuery(yapperId ? QUERY_SINGLE_YAPPER : QUERY_ME, {
        variables: { yapperId: yapperId },
    });
    // Check if data is returning from the `QUERY_ME` query, then the `QUERY_SINGLE_YAPPER` query
    const yapper = data?.me || data?.yapper || {};
    console.log(yapper);
    // Use React Router's `<Navigate />` component to redirect to personal profile page if username is yours
    if (Auth.loggedIn() && Auth.getProfile().data._id === yapperId) {
        return _jsx(Navigate, { to: "/me" });
    }
    if (loading) {
        return _jsx(SplashScreen, {});
    }
    if (!yapper?.name) {
        return (_jsx("h4", { children: "You need to be logged in to see your profile page. Use the navigation links above to sign up or log in!" }));
    }
    return (_jsx("div", { children: _jsx("h2", { children: yapper?.name }) }));
};
export default Profile;
