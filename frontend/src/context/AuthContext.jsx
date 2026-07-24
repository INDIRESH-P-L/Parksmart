// Auth session state: user + token, persisted to localStorage, re-validated
// against GET /auth/me on boot so a stale/revoked token can't fake a session.
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as authService from '../services/authService.js';
import { STORAGE_KEYS } from '../utils/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.user)) ?? null;
    } catch {
      return null;
    }
  });
  // "booting" gates ProtectedRoute until the stored token has been verified,
  // so a hard refresh doesn't flash the login page for a valid session.
  const [booting, setBooting] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.token)));

  const persist = (nextUser, token) => {
    setUser(nextUser);
    if (token) localStorage.setItem(STORAGE_KEYS.token, token);
    if (nextUser) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
  };

  const clear = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  // Boot: hydrate the session from the API if a token exists.
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) return;
    authService
      .me()
      .then(({ data }) => persist(data.user))
      .catch(() => clear()) // token invalid/expired/revoked
      .finally(() => setBooting(false));
  }, [clear]);

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    persist(data.user, data.token);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authService.register(payload);
    persist(data.user, data.token);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Best-effort server-side revoke; the local session dies regardless.
    try {
      await authService.logout();
    } catch {
      /* offline logout is still a logout */
    }
    clear();
  }, [clear]);

  const updateProfile = useCallback(async (fields) => {
    const { data } = await authService.updateProfile(fields);
    persist(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthed: Boolean(user),
      isAdmin: user?.role === 'admin',
      isOperator: user?.role === 'operator',
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, booting, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
};
