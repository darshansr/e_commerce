'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Customer, LoginInput, RegisterCustomerInput, AuthResult, CurrentUser } from '@meghana/shared-types';

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterCustomerInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  updateCustomer: (input: Partial<Customer>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VENDURE_SHOP_API_URL = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

const GET_CURRENT_USER = `
  query GetCurrentUser {
    activeCustomer {
      id
      createdAt
      updatedAt
      emailAddress
      title
      firstName
      lastName
      phoneNumber
      emailAddressVerified
      customFields
      addresses {
        id
        fullName
        company
        streetLine1
        streetLine2
        city
        province
        postalCode
        country { id code name enabled translations { id languageCode name } }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
        customFields
      }
      orders { items { id code state orderPlacedAt total totalWithTax currencyCode } totalItems }
      historyEntries { items { id createdAt type isPublic administrator { id firstName lastName emailAddress } data } totalItems }
      authenticationMethods { id strategy metadata }
      externalAuthenticationMethods { id strategy externalIdentifier }
      groups { id name customers { id } }
    }
    me {
      id
      identifier
      channels { id token code permissions }
    }
  }
`;

const LOGIN = `
  mutation Login($username: String!, $password: String!, $rememberMe: Boolean) {
    login(username: $username, password: $password, rememberMe: $rememberMe) {
      ... on CurrentUser {
        id
        identifier
        channels { id token code permissions }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
      ... on NotVerifiedError {
        errorCode
        message
      }
    }
  }
`;

const REGISTER = `
  mutation Register($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
        errorData
      }
    }
  }
`;

const LOGOUT = `
  mutation Logout {
    logout {
      success
    }
  }
`;

const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      ... on Customer {
        id
        emailAddress
        firstName
        lastName
        phoneNumber
        customFields
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const REQUEST_PASSWORD_RESET = `
  mutation RequestPasswordReset($emailAddress: String!) {
    requestPasswordReset(emailAddress: $emailAddress) {
      success
    }
  }
`;

const RESET_PASSWORD = `
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ... on CurrentUser {
        id
        identifier
        channels { id token code permissions }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InvalidTokenError {
        errorCode
        message
      }
      ... on ExpiredTokenError {
        errorCode
        message
      }
    }
  }
`;

const VERIFY_EMAIL = `
  mutation VerifyEmail($token: String!) {
    verifyEmailAddress(token: $token) {
      ... on CurrentUser {
        id
        identifier
        channels { id token code permissions }
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on InvalidTokenError {
        errorCode
        message
      }
      ... on ExpiredTokenError {
        errorCode
        message
      }
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomer = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchGraphQL(GET_CURRENT_USER);
      if (data.activeCustomer) {
        setCustomer(data.activeCustomer);
        setIsAuthenticated(true);
      } else {
        setCustomer(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setCustomer(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  const login = async (input: LoginInput): Promise<AuthResult> => {
    setError(null);
    try {
      const data = await fetchGraphQL(LOGIN, {
        username: input.username,
        password: input.password,
        rememberMe: input.rememberMe,
      });
      const result = data.login;
      if ('errorCode' in result) {
        setError(result.message);
        return { success: false, errorMessage: result.message };
      }
      await refreshCustomer();
      return { success: true, currentUser: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      return { success: false, errorMessage: message };
    }
  };

  const register = async (input: RegisterCustomerInput): Promise<AuthResult> => {
    setError(null);
    try {
      const data = await fetchGraphQL(REGISTER, { input });
      const result = data.registerCustomer;
      if ('errorCode' in result) {
        setError(result.message);
        return { success: false, errorMessage: result.message };
      }
      // Auto-login after registration
      return login({ username: input.emailAddress, password: input.password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      return { success: false, errorMessage: message };
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await fetchGraphQL(LOGOUT);
      setCustomer(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  const updateCustomer = async (input: Partial<Customer>) => {
    setError(null);
    try {
      const data = await fetchGraphQL(UPDATE_CUSTOMER, { input });
      const result = data.updateCustomer;
      if ('errorCode' in result) {
        throw new Error(result.message);
      }
      setCustomer(prev => prev ? { ...prev, ...result } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const requestPasswordReset = async (emailAddress: string) => {
    setError(null);
    try {
      await fetchGraphQL(REQUEST_PASSWORD_RESET, { emailAddress });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset');
      throw err;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setError(null);
    try {
      const data = await fetchGraphQL(RESET_PASSWORD, { token, password });
      const result = data.resetPassword;
      if ('errorCode' in result) {
        throw new Error(result.message);
      }
      await refreshCustomer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      throw err;
    }
  };

  const verifyEmail = async (token: string) => {
    setError(null);
    try {
      const data = await fetchGraphQL(VERIFY_EMAIL, { token });
      const result = data.verifyEmailAddress;
      if ('errorCode' in result) {
        throw new Error(result.message);
      }
      await refreshCustomer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify email');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshCustomer,
        updateCustomer,
        requestPasswordReset,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}