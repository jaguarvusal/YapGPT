import { gql } from '@apollo/client';

export const QUERY_YAPPERS = gql`
  query allYappers {
    yappers {
      _id
      name
    }
  }
`;

export const QUERY_SINGLE_YAPPER = gql`
  query singleYapper($yapperId: ID!) {
    yapper(yapperId: $yapperId) {
      _id
      name
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
      _id
      name
    }
  }
`;
