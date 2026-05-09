import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('taskforge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taskforge_token');
    if (token) {
      api.get('/auth/me')
        .then((u) => { setUser(u); localStorage.setItem('taskforge_user', JSON.stringify(u)); })
        .catch(() => { setUser(null); localStorage.removeItem('taskforge_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Heartbeat: Ping server every 5 minutes to keep session alive and track activity
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      api.post('/auth/ping').catch(() => {});
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('taskforge_token', data.accessToken);
    localStorage.setItem('taskforge_refresh', data.refreshToken);
    localStorage.setItem('taskforge_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('taskforge_token', data.accessToken);
    localStorage.setItem('taskforge_refresh', data.refreshToken);
    localStorage.setItem('taskforge_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('taskforge_token');
    localStorage.removeItem('taskforge_refresh');
    localStorage.removeItem('taskforge_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
