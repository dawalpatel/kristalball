import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('military_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('military_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success && res.data.data.user) {
            setUser(res.data.data.user);
            localStorage.setItem('military_user', JSON.stringify(res.data.data.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('military_token');
          localStorage.removeItem('military_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, user: loggedUser } = res.data.data;
      localStorage.setItem('military_token', token);
      localStorage.setItem('military_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout notification error:', err);
    } finally {
      localStorage.removeItem('military_token');
      localStorage.removeItem('military_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
