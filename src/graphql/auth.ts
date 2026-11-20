import { gql } from "@apollo/client";

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($auth: ForgotPasswordInput!) {
    forgotPassword(auth: $auth)
  }
`;

export type ForgotPasswordResponse = { forgotPassword: null };
export type ForgotPasswordVariables = { auth: { email: string } };

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($auth: ResetPasswordInput!) {
    resetPassword(auth: $auth)
  }
`;

export type ResetPasswordResponse = { resetPassword: null };
export type ResetPasswordVariables = {
  auth: { newPassword: string; confirmPassword: string };
};

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

export const SIGNUP_MUTATION = gql`
  mutation Signup($auth: SignupInput!) {
    signup(auth: $auth) {
      access_token
      refresh_token
      user {
        id
        email
      }
    }
  }
`;

export type SignupVariables = {
  auth: {
    email: string;
    password: string;
    confirmPassword: string;
  };
};

export type SignupResponse = {
  signup: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
  };
};
