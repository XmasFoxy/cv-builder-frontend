import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($auth: AuthInput!) {
    login(auth: $auth) {
      access_token
      refresh_token
      user {
        id
        email
      }
    }
  }
`;

export type LoginVariables = {
  auth: {
    email: string;
    password: string;
  };
};

export type LoginResponse = {
  login: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
  };
};
