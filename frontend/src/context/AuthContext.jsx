import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

const STORAGE_KEY = 'hrms.session';
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt or blocked storage shouldn't crash the app - just start signed out.
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  // Keep the API client's token in sync with whatever session is active,
  // including on first load from localStorage.
  useEffect(() => {
    setAuthToken(session?.token ?? null);
  }, [session?.token]);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Any 401 from the API (expired/invalid token) drops the user back to sign in.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  const persist = (next) => {
    setSession(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const signIn = async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    persist({ token: data.token, user: data.user });
    return data.user;
  };

  const signUp = async ({ companyName, name, email, password }) => {
    const data = await authApi.signup({ companyName, name, email, password });
    // Admins created via signup never start with mustChangePassword set, so
    // this is safe to default to false rather than requiring the field.
    persist({ token: data.token, user: { ...data.user, mustChangePassword: false } });
    return data.user;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    await authApi.changePassword({ currentPassword, newPassword });
    if (session) {
      persist({ ...session, user: { ...session.user, mustChangePassword: false } });
    }
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token),
      signIn,
      signUp,
      signOut,
      changePassword,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
