import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';

import { QUERY_SINGLE_YAPPER, QUERY_ME } from '../utils/queries';
import { getRandomColor } from '../utils/colors';

import Auth from '../utils/auth';
import SplashScreen from '../components/SplashScreen.tsx';
import DefaultAvatar from '../components/DefaultAvatar';

const Profile = () => {
  const { yapperId } = useParams();
  const navigate = useNavigate();

  // If there is no `yapperId` in the URL as a parameter, execute the `QUERY_ME` query instead for the logged in user's information
  const { loading, data, error, refetch } = useQuery(
    yapperId ? QUERY_SINGLE_YAPPER : QUERY_ME,
    {
      variables: { yapperId: yapperId },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'cache-first'
    }
  );

  // Refetch user data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Check if data is returning from the `QUERY_ME` query, then the `QUERY_SINGLE_YAPPER` query
  const yapper = data?.me || data?.yapper || {};
  console.log('Full data:', JSON.stringify(data, null, 2));
  console.log('Yapper data:', JSON.stringify(yapper, null, 2));
  console.log('Email:', yapper?.email);
  console.log('Avatar:', yapper?.avatar);
  console.log('Query error:', error);
  console.log('Query being used:', yapperId ? 'QUERY_SINGLE_YAPPER' : 'QUERY_ME');
  
  const formatJoinDate = () => {
    if (yapper?.createdAt) {
      try {
        // Convert Unix timestamp (milliseconds) to Date object
        const date = new Date(parseInt(yapper.createdAt));
        if (!isNaN(date.getTime())) {
          return `Joined in ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        }
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }
    return '';
  };

  // Use React Router's `<Navigate />` component to redirect to personal profile page if username is yours
  if (Auth.loggedIn() && Auth.getProfile().data._id === yapperId) {
    return <Navigate to="/me" />;
  }

  if (loading) {
    return <SplashScreen />;
  }

  if (!yapper?.name) {
    return (
      <h4>
        You need to be logged in to see your profile page. Use the navigation
        links above to sign up or log in!
      </h4>
    );
  }

  const handleLogout = () => {
    Auth.logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center pt-8">
      {/* Profile Icon Change Panel */}
      <div className="bg-[#10242c] backdrop-blur-md rounded-lg shadow-md p-0 w-[600px] mx-4 border-4 border-[#17475c] overflow-hidden h-[220px] relative">
        <div 
          className="w-[300px] h-[220px] mx-auto pt-8 cursor-pointer"
          onClick={() => navigate('/avatar')}
        >
          <img 
            src="/assets/choose.png" 
            alt="Choose new icon" 
            className="w-full h-full object-contain"
          />
        </div>
        <button 
          className="absolute top-4 right-4 bg-[#17475c] text-white p-3 rounded-lg hover:bg-[#1a5266] transition-all duration-150 text-center border-b-4 border-[#123a4c] active:translate-y-1 active:border-b-0"
          onClick={() => navigate('/avatar')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      <div className="w-[600px] mx-4 mt-6">
        <div className="flex flex-col items-center mb-4">
          <div 
            className="w-24 h-24 rounded-full mb-4 overflow-hidden border-8 border-black"
            style={{ backgroundColor: getRandomColor(yapper?.name || '') }}
          >
            {yapper?.avatar ? (
              <img 
                src={`/assets/${yapper.avatar}`}
                alt={`${yapper?.name}'s avatar`}
                className="w-full h-full object-cover object-bottom translate-y-[15%]"
              />
            ) : (
              <DefaultAvatar username={yapper?.name || ''} className="w-full h-full text-4xl" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-black">
            {yapper?.name}
          </h2>
        </div>
        <p className="text-lg text-gray-600 mt-1">
          {yapper?.email}
        </p>
        <p className="text-lg text-black mt-1">
          {formatJoinDate()}
        </p>
        <div className="flex space-x-8 mt-2">
          <span className="text-lg text-[#1E90FF] font-bold">{yapper?.following?.length || 0} Following</span>
          <span className="text-lg text-[#1E90FF] font-bold">{yapper?.followers?.length || 0} Followers</span>
        </div>
        <div className="w-full h-1 bg-[#17475c] mt-4 rounded-full"></div>
      </div>

      <div className="w-[600px] mx-4 mt-6 mb-8">
        <div className="flex justify-center w-full">
          <button
            onClick={handleLogout}
            className="w-full bg-[#e15831] text-white py-2 px-4 rounded-lg hover:bg-[#c94d2b] transition-all duration-150 text-center border-b-4 border-[#b34426] active:translate-y-1 active:border-b-0 uppercase font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
