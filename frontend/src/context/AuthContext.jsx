import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('propready_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('propready_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('propready_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth check failed:", err);
          setUser(null);
          localStorage.removeItem('propready_token');
          localStorage.removeItem('propready_user');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('propready_token', access_token);
    localStorage.setItem('propready_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (email, password, fullName) => {
    const res = await apiClient.post('/auth/register', { email, password, full_name: fullName });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('propready_token', access_token);
    localStorage.setItem('propready_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn("Logout endpoint error:", e);
    } finally {
      localStorage.removeItem('propready_token');
      localStorage.removeItem('propready_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
