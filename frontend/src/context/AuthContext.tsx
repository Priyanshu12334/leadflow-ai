import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { authApi } from '../api/authApi';
import { DEMO_TOKEN_STORAGE_KEY } from '../api/axiosClient';
import type { PropsWithChildren } from 'react';
import type { User } from '../types';
import { getErrorMessage, isApiError } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  loginWithGoogle: () => void;
  loginWithDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  updateUserData: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    setAuthError(null);
    try {
      const data = await userApi.getCurrentUser();
      setUser(data.user || null);
    } catch (error: unknown) {
      if (!isApiError(error) || error.status !== 401) {
        setAuthError(getErrorMessage(error) || 'Failed to authenticate user');
      } else {
        window.sessionStorage.removeItem(DEMO_TOKEN_STORAGE_KEY);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const loginWithGoogle = (): void => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const loginWithDemo = async (): Promise<void> => {
    const token = await authApi.loginWithDemo();
    window.sessionStorage.setItem(DEMO_TOKEN_STORAGE_KEY, token);
    await fetchCurrentUser();
    navigate('/demo', { replace: true });
  };

  const logout = async (): Promise<void> => {
    const isDemo = Boolean(user?.isDemo);
    try {
      await authApi.logout();
    } catch (error: unknown) {
      console.error('Logout error:', error);
    } finally {
      window.sessionStorage.removeItem(DEMO_TOKEN_STORAGE_KEY);
      setUser(null);
      window.location.href = isDemo ? '/login' : '/';
    }
  };

  const updateUserData = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const disconnectGoogle = async (): Promise<void> => {
    const data = await userApi.disconnectGoogle();
    setUser(data.user);
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    loginWithGoogle,
    loginWithDemo,
    logout,
    refreshUser: fetchCurrentUser,
    disconnectGoogle,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
