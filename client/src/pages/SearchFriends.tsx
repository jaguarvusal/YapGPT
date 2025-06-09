import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_YAPPERS, QUERY_ME } from '../utils/queries';
import { FOLLOW_USER, UNFOLLOW_USER } from '../utils/mutations.js';
import { getRandomColor } from '../utils/colors';
import passwordIcon from '/assets/password.png';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import Auth from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import DefaultAvatar from '../components/DefaultAvatar';

const SearchFriends: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const { data: yappersData, loading: yappersLoading, error: yappersError } = useQuery(QUERY_YAPPERS);
  const { data: meData, refetch: refetchMe } = useQuery(QUERY_ME);
  const [followUser] = useMutation(FOLLOW_USER);
  const [unfollowUser] = useMutation(UNFOLLOW_USER);

  // Initialize followingUsers with current user's following list
  useEffect(() => {
    if (meData?.me?.following) {
      const followingIds = new Set(meData.me.following.map((user: any) => user._id));
      setFollowingUsers(followingIds);
      
      // Also update search results if they exist
      setSearchResults(prev => 
        prev.map(user => ({
          ...user,
          isFollowing: followingIds.has(user._id)
        }))
      );
    }
  }, [meData]);

  const handleFollow = async (userId: string) => {
    if (!Auth.loggedIn()) {
      console.log('User not logged in');
      return;
    }

    try {
      console.log('Attempting to follow/unfollow user:', userId);
      console.log('Current following state:', followingUsers.has(userId));

      if (followingUsers.has(userId)) {
        // Unfollow
        console.log('Unfollowing user');
        const { data: unfollowData } = await unfollowUser({
          variables: { userId },
          refetchQueries: [{ query: QUERY_ME }]
        });

        if (unfollowData?.unfollowUser) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          
          // Update search results
          setSearchResults(prev => 
            prev.map(user => 
              user._id === userId 
                ? { ...user, isFollowing: false }
                : user
            )
          );
        }
      } else {
        // Follow
        console.log('Following user');
        const { data: followData } = await followUser({
          variables: { userId },
          refetchQueries: [{ query: QUERY_ME }]
        });

        if (followData?.followUser) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
          });
          
          // Update search results
          setSearchResults(prev => 
            prev.map(user => 
              user._id === userId 
                ? { ...user, isFollowing: true }
                : user
            )
          );
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        
        // If the error indicates we're already following, update the state to reflect that
        if (error.message.includes('already following')) {
          setFollowingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
          });
          
          // Update search results to show following state
          setSearchResults(prev => 
            prev.map(user => 
              user._id === userId 
                ? { ...user, isFollowing: true }
                : user
            )
          );
        }
      }
      // Always refresh the following state from the server
      const { data: refreshedData } = await refetchMe();
      if (refreshedData?.me?.following) {
        const followingIds = new Set(refreshedData.me.following.map((user: any) => user._id));
        setFollowingUsers(followingIds);
      }
    }
  };

  const handleClear = () => {
    setSearchText('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchText(newValue);
    if (!newValue.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchText.trim()) {
      const currentUserId = Auth.getProfile().data._id;
      const filteredUsers = yappersData?.yappers.filter((user: any) =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) && user._id !== currentUserId
      ) || [];
      
      console.log('Current meData:', meData);
      console.log('Following list from meData:', meData?.me?.following);
      
      // Get current following list from meData
      const currentFollowing = new Set(meData?.me?.following?.map((user: any) => user._id) || []);
      console.log('Current following Set:', Array.from(currentFollowing));
      
      // Update search results with following state from meData
      const updatedResults = filteredUsers.map(user => {
        const isFollowing = currentFollowing.has(user._id);
        console.log(`User ${user.name} (${user._id}) following status:`, isFollowing);
        return {
          ...user,
          isFollowing
        };
      });
      
      console.log('Updated search results:', updatedResults);
      
      setSearchResults(updatedResults);
      setHasSearched(true);
      
      // Also update the followingUsers state to match meData
      setFollowingUsers(currentFollowing);
    }
  };

  // Add a useEffect to log when meData changes
  useEffect(() => {
    console.log('meData changed:', meData);
    if (meData?.me?.following) {
      console.log('Following list updated:', meData.me.following);
    }
  }, [meData]);

  return (
    <div className="flex flex-col w-full relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 md:top-8 right-4 md:right-[calc(4rem+4px)] bg-[#18475c] hover:bg-[#153d4f] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-md"
      >
        <FaArrowLeft />
        Back
      </button>
      <div className="px-4 md:px-24 pt-8">
        <h1 className="text-2xl md:text-3xl font-bold text-black mb-8">
          Search for friends
        </h1>
      </div>
      <div className="px-4 md:px-24 md:pr-4">
        <div className="flex flex-col">
          <div className="flex items-center bg-[#17475c]/80 rounded-[2rem] px-4 py-5 w-full md:w-[calc(100%-4rem)] border-4 md:border-8 border-black/80 overflow-hidden">
            <img src={passwordIcon} alt="Search" className="w-8 h-8 md:w-10 md:h-10 mr-3" />
            <input
              type="text"
              placeholder="Search by username"
              value={searchText}
              onChange={handleInputChange}
              onKeyDown={handleSearch}
              className="w-full outline-none text-white placeholder-gray-400 bg-transparent text-lg md:text-xl placeholder:text-lg md:placeholder:text-xl"
            />
            {searchText && (
              <button 
                onClick={handleClear}
                className="ml-3 w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#e15831] flex items-center justify-center shrink-0"
              >
                <span className="text-black text-base md:text-lg font-bold leading-none -mt-0.5">×</span>
              </button>
            )}
          </div>
          <div className="h-[2px] bg-gray-800 w-full md:w-[calc(100%-4rem)] mt-8 md:mt-12"></div>
          {searchText && !hasSearched && (
            <p className="text-gray-600 text-base md:text-lg mt-4 ml-4">
              Press Enter to see results for "{searchText}"
            </p>
          )}
          
          {yappersLoading ? (
            <div className="flex flex-col items-center mt-8">
              <p className="text-gray-600 text-lg md:text-xl">Loading users...</p>
            </div>
          ) : yappersError ? (
            <div className="flex flex-col items-center mt-8">
              <p className="text-red-600 text-lg md:text-xl">Error loading users. Please try again.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-8 w-full md:w-[calc(100%-8rem)] mx-auto flex justify-center">
              <div className="w-full">
                {searchResults.map((user, index) => (
                  <div 
                    key={user._id}
                    className={`bg-[#17475c] p-4 md:p-6 border-2 border-black shadow-md hover:shadow-lg transition-shadow ${
                      index === 0 ? 'rounded-t-2xl' : ''
                    } ${
                      index === searchResults.length - 1 ? 'rounded-b-2xl mb-8' : ''
                    } ${
                      index !== searchResults.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 border-4 border-black mr-3 md:mr-4 overflow-hidden"
                        style={{ backgroundColor: getRandomColor(user.name) }}
                      >
                        {user.avatar ? (
                          <img 
                            src={`/assets/${user.avatar}`}
                            alt={`${user.name}'s avatar`}
                            className="w-full h-full object-cover object-bottom translate-y-[15%]"
                          />
                        ) : (
                          <DefaultAvatar username={user.name} className="w-full h-full text-xl md:text-2xl" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-white truncate">{user.name}</h3>
                        <p className="text-gray-300 text-sm mt-1 truncate">{user.email || 'No email available'}</p>
                      </div>
                      <button 
                        onClick={() => handleFollow(user._id)}
                        className={`flex items-center px-3 md:px-4 py-2 rounded-lg transition-colors duration-150 border-b-4 active:translate-y-1 active:border-b-0 text-sm md:text-base whitespace-nowrap ${
                          user.isFollowing
                            ? 'bg-purple-500 text-black hover:bg-purple-600 border-purple-600'
                            : 'bg-[#2ECC71] text-white hover:bg-[#27AE60] border-[#27AE60]'
                        }`}
                      >
                        <FaUserPlus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                        {user.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center mt-8">
              <p className="text-gray-600 text-lg md:text-xl">No users found matching "{searchText}"</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchFriends; 