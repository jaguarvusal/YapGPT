import { gql } from '@apollo/client';

export const END_SESSION = gql`
  mutation EndSession($sessionId: String!) {
    endSession(sessionId: $sessionId) {
      success
    }
  }
`; 