import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage } from '../utils/tokenStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isAuthenticated = Boolean(user && tokenStorage.getAccessToken());

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };

    const bootstrap = async () => {
      if (!tokenStorage.getAccessToken()) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        tokenStorage.setUser(currentUser);
        setUser(currentUser);
      } catch (_error) {
        tokenStorage.clearSession();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    const handleRefreshEvent = () => {
      bootstrap();
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    window.addEventListener('auth-refresh', handleRefreshEvent);

    bootstrap();

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
      window.removeEventListener('auth-refresh', handleRefreshEvent);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const response = await authApi.login(payload);
    if (response.requiresTwoFactor || response.requiresTwoFactorSetup) {
      return response;
    }
    tokenStorage.setSession(response);
    setUser(response.user);
    return response.user;
  }, []);

  const finalizeLogin = useCallback((session) => {
    tokenStorage.setSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (payload) => {
    const session = await authApi.register(payload);
    tokenStorage.setSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.clearSession();
      setUser(null);
    }
  }, []);

  const updateCurrentUser = useCallback((updatedUser) => {
    tokenStorage.setUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated,
      isBootstrapping,
      login,
      finalizeLogin,
      logout,
      register,
      updateCurrentUser,
      clearSession,
    }),
    [clearSession, isAuthenticated, isBootstrapping, login, finalizeLogin, logout, register, updateCurrentUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
