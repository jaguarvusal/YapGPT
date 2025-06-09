import { gql } from '@apollo/client';

export const QUERY_YAPPERS = gql`
  query yappers {
    yappers {
      _id
      name
      email
      avatar
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

export const QUERY_SINGLE_YAPPER = gql`
  query singleYapper($yapperId: ID!) {
    yapper(yapperId: $yapperId) {
      _id
      name
      email
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
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
        activeLevel
      }
      followers {
        _id
        name
        avatar
        activeLevel
      }
    }
  }
`;
