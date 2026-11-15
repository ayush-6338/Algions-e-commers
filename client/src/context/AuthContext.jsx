import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearSession = () => setUser(null);
    window.addEventListener('skykart:unauthorized', clearSession);
    const token = localStorage.getItem('skykart-token');
    if (token) api.get('/auth/me').then(({ data }) => setUser(data.data)).catch(() => {
      localStorage.removeItem('skykart-token');
      setUser(null);
    }).finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener('skykart:unauthorized', clearSession);
  }, []);

  const authenticate = useCallback(async (path, input) => {
    const { data } = await api.post(path, input);
    localStorage.setItem('skykart-token', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const login = useCallback((input) => authenticate('/auth/login', input), [authenticate]);
  const register = useCallback((input) => authenticate('/auth/register', input), [authenticate]);
  const logout = useCallback(() => { localStorage.removeItem('skykart-token'); setUser(null); }, []);
  const value = useMemo(() => ({ user, loading, ready: !loading, login, register, logout, signIn: authenticate, signOut: logout }), [user, loading, login, register, logout, authenticate]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
