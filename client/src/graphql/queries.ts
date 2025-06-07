import { gql } from '@apollo/client';

export const GET_FLIRT_FEEDBACK = gql`
  query GetFlirtFeedback($sessionId: String!) {
    getFlirtFeedback(sessionId: $sessionId)
  }
`; 