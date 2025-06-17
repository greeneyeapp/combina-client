import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useApiAuthStore } from '@/store/apiAuthStore';
import axios from 'axios';
import API_URL from '@/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setJwt, clearJwt, loadJwt, isReady } = useApiAuthStore();

  useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  useEffect(() => {
    if (!isReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await axios.post(`${API_URL}/token`, { id_token: idToken });
          await setJwt(response.data.access_token);
        } catch (error) {
          console.error("API token alınamadı:", error);
          await clearJwt();
        }
      } else {
        await clearJwt();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isReady, setJwt, clearJwt]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const value = { user, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};