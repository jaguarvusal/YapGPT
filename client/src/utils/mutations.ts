import { gql } from '@apollo/client';

export const ADD_YAPPER = gql`
  mutation addYapper($input: YapperInput!) {
    addYapper(input: $input) {
      token
      yapper {
        _id
        name
        activeLevel
        completedLevels
        hearts
        streak
        lastLoginDate
        lastLoginTime
        heartRegenerationTimer
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($identifier: String!, $password: String!) {
    login(identifier: $identifier, password: $password) {
      token
      yapper {
        _id
        name
        activeLevel
        completedLevels
        hearts
        streak
        lastLoginDate
        heartRegenerationTimer
      }
    }
  }
`;

export const REMOVE_SKILL = gql`
  mutation removeSkill($skill: String!) {
    removeSkill(skill: $skill) {
      _id
      name
      skills
    }
  }
`;

export const UPLOAD_AUDIO = gql`
  mutation UploadAudio($input: UploadAudioInput!) {
    uploadAudio(input: $input) {
      transcript
      confidenceScore
      fillerWordCount
      grammarScore
      wordChoiceScore
      conciseness {
        wordCount
        sentenceCount
      }
      charismaScore
      relevanceScore
      suggestions
    }
  }
`;

export const UPDATE_PROGRESS = gql`
  mutation updateProgress($activeLevel: Int!, $completedLevels: [Int!]!) {
    updateProgress(activeLevel: $activeLevel, completedLevels: $completedLevels) {
      _id
      name
      activeLevel
      completedLevels
    }
  }
`;

export const UPDATE_HEARTS_AND_STREAK = gql`
  mutation updateHeartsAndStreak($hearts: Int!, $streak: Int!, $lastLoginDate: String, $heartRegenerationTimer: String) {
    updateHeartsAndStreak(hearts: $hearts, streak: $streak, lastLoginDate: $lastLoginDate, heartRegenerationTimer: $heartRegenerationTimer) {
      _id
      hearts
      streak
      lastLoginDate
      lastLoginTime
      heartRegenerationTimer
    }
  }
`;

export const FOLLOW_USER = gql`
  mutation followUser($userId: ID!) {
    followUser(userId: $userId) {
      _id
      following {
        _id
        name
      }
      followers {
        _id
        name
      }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation unfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      _id
      following {
        _id
        name
      }
      followers {
        _id
        name
      }
    }
  }
`;

export const UPDATE_AVATAR = gql`
  mutation updateAvatar($avatar: String!) {
    updateAvatar(avatar: $avatar) {
      _id
      name
      email
      skills
      activeLevel
      completedLevels
      hearts
      streak
      lastLoginDate
      lastLoginTime
      heartRegenerationTimer
      avatar
      createdAt
      following {
        _id
        name
        avatar
      }
      followers {
        _id
        name
        avatar
      }
    }
  }
`;
