import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hms_token') || '');
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    auth.me()
      .then(res => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('hms_token');
        setToken('');
      })
      .finally(() => setLoading(false));
  }, [token]);

  /**
   * Can be called two ways:
   *   login(email, password)        — does the API call internally
   *   login(token, userObject)      — token + user already resolved externally
   */
  const login = async (emailOrToken, passwordOrUser) => {
    if (typeof passwordOrUser === 'object' && passwordOrUser !== null) {
      // Called as login(token, user) — already authenticated
      localStorage.setItem('hms_token', emailOrToken);
      setToken(emailOrToken);
      setUser(passwordOrUser);
      return { token: emailOrToken, user: passwordOrUser };
    }
    // Called as login(email, password)
    const res = await auth.login(emailOrToken, passwordOrUser);
    localStorage.setItem('hms_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    setToken('');
    setUser(null);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
