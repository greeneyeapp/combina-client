import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string | null;
  email: string | null;
  isGuest: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // In a real app, you would validate credentials against a backend
    // For now, we'll just create a mock user
    const mockUser = {
      id: '1',
      name: 'Test User',
      email,
      isGuest: false,
    };

    setUser(mockUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Failed to save user:', error);
    }

    return mockUser;
  };

  const loginWithProvider = async (provider: string) => {
    // In a real app, you would authenticate with the provider
    // For now, we'll just create a mock user
    const mockUser = {
      id: '2',
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      isGuest: false,
    };

    setUser(mockUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Failed to save user:', error);
    }

    return mockUser;
  };

  const loginAsGuest = async () => {
    const guestUser = {
      id: 'guest',
      name: null,
      email: null,
      isGuest: true,
    };

    setUser(guestUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(guestUser));
    } catch (error) {
      console.error('Failed to save guest user:', error);
    }

    return guestUser;
  };

  const register = async (name: string, email: string, password: string) => {
    // In a real app, you would register the user with a backend
    // For now, we'll just create a mock user
    const mockUser = {
      id: '3',
      name,
      email,
      isGuest: false,
    };

    setUser(mockUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Failed to save user:', error);
    }

    return mockUser;
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  return {
    user,
    isLoading,
    login,
    loginWithProvider,
    loginAsGuest,
    register,
    logout,
  };
}