'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './constants';
import { LoginResponse, User, UserRole } from '@/types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore corrupted local storage
        }
      }
      // Re-fetch profile to ensure token validity
      fetchProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchProfile(authToken: string) {
    try {
      const profile = await apiClient<User>('/users/me', { token: authToken });
      setUser(profile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // If fetching profile fails (e.g. expired token), logout
      logout();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      const result = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(result.accessToken);
      setUser(result.user);

      localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      document.cookie = `auth_token=${result.accessToken}; path=/; max-age=86400; SameSite=Lax`;

      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  }

  async function refreshUser() {
    if (!token) return;
    await fetchProfile(token);
  }

  function hasRole(...roles: UserRole[]) {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true; // Admins have super-user access
    return roles.includes(user.role);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        hasRole,
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
