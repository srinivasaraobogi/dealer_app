import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const savedDealer = await AsyncStorage.getItem('dealer');
      if (token && savedDealer) {
        setDealer(JSON.parse(savedDealer));
        setIsAuthenticated(true);
        // Refresh dealer data
        try {
          const res = await authAPI.me();
          const updatedDealer = res.data.data;
          setDealer(updatedDealer);
          await AsyncStorage.setItem('dealer', JSON.stringify(updatedDealer));
        } catch {
          // Token might be expired, try refresh handled by interceptor
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { accessToken, refreshToken, dealer: dealerData } = response.data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('dealer', JSON.stringify(dealerData));
    setDealer(dealerData);
    setIsAuthenticated(true);
    return dealerData;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { accessToken, refreshToken, dealer: dealerData } = response.data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('dealer', JSON.stringify(dealerData));
    setDealer(dealerData);
    setIsAuthenticated(true);
    return dealerData;
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      await authAPI.logout(refreshToken);
    } catch {
      // Ignore logout API errors
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'dealer']);
      setDealer(null);
      setIsAuthenticated(false);
    }
  };

  const updateDealer = (updatedData) => {
    setDealer(prev => ({ ...prev, ...updatedData }));
    AsyncStorage.setItem('dealer', JSON.stringify({ ...dealer, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{
      dealer,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateDealer,
      refreshDealer: checkAuthState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
