console.log('ProfileSidebar module is being loaded');

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { QUERY_ME } from '../utils/queries';
import { getRandomColor } from '../utils/colors';
import passwordIcon from '/assets/password.png';
import DefaultAvatar from './DefaultAvatar';

const ProfileSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const navigate = useNavigate();
  const { data, refetch } = useQuery(QUERY_ME, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first'
  });

  const yapper = data?.me;

  // Refetch user data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  console.log('ProfileSidebar is rendering');

  return (
    <div className="flex flex-col space-y-4">
      {/* Tabs */}
      <div className="bg-[#17475c] backdrop-blur-md rounded-xl p-4 shadow-lg border-4 border-[#17475c]">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center relative ${
              activeTab === 'following' ? 'text-white' : 'text-gray-300'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-b-lg"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2 px-4 rounded-lg transition-all duration-150 text-center relative ${
              activeTab === 'followers' ? 'text-white' : 'text-gray-300'
            }`}
          >
            Followers
            {activeTab === 'followers' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-b-lg"></div>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="mt-4">
          {activeTab === 'following' ? (
            yapper?.following?.length > 0 ? (
              <div className="space-y-4">
                {yapper.following.map((user: any) => (
                  <div key={user._id} className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full overflow-hidden border-4 border-black flex-shrink-0"
                      style={{ backgroundColor: getRandomColor(user.name) }}
                    >
                      {user.avatar ? (
                        <img 
                          src={`/assets/${user.avatar}`}
                          alt={`${user.name}'s avatar`}
                          className="w-full h-full object-cover object-bottom translate-y-[15%]"
                        />
                      ) : (
                        <DefaultAvatar username={user.name} className="w-full h-full text-xl" />
                      )}
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img src="/assets/friends.png" alt="Friends" className="w-72 h-auto mb-4" />
                <div className="text-center text-gray-300 text-lg">
                  Yapping is more fun and effective when you connect with others.
                </div>
              </div>
            )
          ) : (
            yapper?.followers?.length > 0 ? (
              <div className="space-y-4">
                {yapper.followers.map((user: any) => (
                  <div key={user._id} className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full overflow-hidden border-4 border-black flex-shrink-0"
                      style={{ backgroundColor: getRandomColor(user.name) }}
                    >
                      {user.avatar ? (
                        <img 
                          src={`/assets/${user.avatar}`}
                          alt={`${user.name}'s avatar`}
                          className="w-full h-full object-cover object-bottom translate-y-[15%]"
                        />
                      ) : (
                        <DefaultAvatar username={user.name} className="w-full h-full text-xl" />
                      )}
                    </div>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-center text-gray-300 text-lg">
                  No followers yet
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Add Friends Panel */}
      <div className="bg-[#f3e0b7]/80 backdrop-blur-md rounded-xl p-4 shadow-lg border-4 border-[#17475c]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Friends</h3>
        <button 
          onClick={() => navigate('/search-friends')}
          className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center">
            <img src={passwordIcon} alt="Search" className="w-10 h-10 mr-3" />
            <span className="font-bold text-black">Find Friends</span>
          </div>
          <span className="text-xl font-bold text-black">&gt;</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar; 