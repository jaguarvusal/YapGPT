import { gql } from '@apollo/client';

export const ADD_YAPPER = gql`
  mutation addYapper($input: YapperInput!) {
    addYapper(input: $input) {
      token
      yapper {
        _id
        name
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
