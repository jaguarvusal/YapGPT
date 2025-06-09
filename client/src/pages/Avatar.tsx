import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { QUERY_ME, QUERY_YAPPERS } from '../utils/queries';
import { UPDATE_AVATAR } from '../utils/mutations';
import { useNavigate } from 'react-router-dom';
import Auth from '../utils/auth';
import { FaArrowLeft } from 'react-icons/fa';

const Avatar: React.FC = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: userData, refetch } = useQuery(QUERY_ME);

  const [updateAvatar] = useMutation(UPDATE_AVATAR, {
    update(cache, { data }) {
      try {
        console.log('Avatar update response:', data);
        const { me } = cache.readQuery({ query: QUERY_ME }) || { me: null };
        console.log('Current cache data:', me);
        
        if (me) {
          cache.writeQuery({
            query: QUERY_ME,
            data: {
              me: {
                ...me,
                avatar: data.updateAvatar.avatar
              }
            }
          });
        }
      } catch (error) {
        console.error('Error updating cache:', error);
      }
    },
    refetchQueries: [
      {
        query: QUERY_ME,
        fetchPolicy: 'network-only'
      },
      {
        query: QUERY_YAPPERS,
        fetchPolicy: 'network-only'
      }
    ],
    awaitRefetchQueries: true
  });

  const handleAvatarSelect = async (avatarPath: string) => {
    try {
      setSelectedAvatar(avatarPath);
      const avatarFilename = avatarPath.split('/').pop() || '';
      console.log('Selected avatar filename:', avatarFilename);
      
      const { data } = await updateAvatar({
        variables: { avatar: avatarFilename }
      });
      
      console.log('Avatar update response:', data);
      
      if (data?.updateAvatar?.avatar) {
        // Force a refetch of the user data
        await refetch();
        // Navigate to profile page
        navigate('/me');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const avatars = [
    '/assets/avatar1.png',
    '/assets/avatar2.png',
    '/assets/avatar3.png',
    '/assets/avatar4.png',
    '/assets/avatar5.png',
    '/assets/avatar6.png',
    '/assets/avatar7.png',
    '/assets/avatar8.png',
    '/assets/avatar9.png'
  ];

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 right-[calc(4rem+4px)] bg-[#18475c] hover:bg-[#153d4f] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-md"
      >
        <FaArrowLeft />
        Back
      </button>
      <div className="px-24 pt-8">
        <h1 className="text-3xl font-bold text-black mb-8">
          Choose Your Avatar
        </h1>
      </div>
      <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
        {avatars.map((avatar) => (
          <div
            key={avatar}
            className="cursor-pointer p-2 transition-all"
            onClick={() => handleAvatarSelect(avatar)}
          >
            <div className="aspect-square rounded-full border-4 border-black overflow-hidden">
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover object-bottom translate-y-4"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Avatar; 