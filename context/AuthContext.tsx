import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { initializeUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases'; // RevenueCat import'u

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
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
  const { clearUserPlan } = useUserPlanStore();

  useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  useEffect(() => {
    if (!isReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && !currentUser.isAnonymous) {
        try {
          // --- YENİ MANTIK BURADA BAŞLIYOR ---
          // Kullanıcı giriş yaptığında, RevenueCat'teki anonim ID'yi
          // Firebase'deki kalıcı UID ile birleştir.
          await Purchases.logIn(currentUser.uid);
          console.log(`RevenueCat user logged in with UID: ${currentUser.uid}`);
          // --- YENİ MANTIK BİTİŞİ ---

          const idToken = await currentUser.getIdToken();
          const response = await axios.post(`${API_URL}/token`, { id_token: idToken });
          await setJwt(response.data.access_token);
          await initializeUserProfile();
          
        } catch (error) {
          console.error("Failed to initialize user session or log in to RevenueCat:", error);
          await clearJwt();
          clearUserPlan();
        }
      } else {
        // Kullanıcı çıkış yaptığında veya anonimse, RevenueCat oturumunu da kapat.
        try {
            await Purchases.logOut();
            console.log("RevenueCat user logged out.");
        } catch (e) {
            console.error("Error logging out from RevenueCat", e);
        }
        await clearJwt();
        clearUserPlan();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isReady, setJwt, clearJwt, clearUserPlan]);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // Çıkış yapıldığında AuthContext'teki onAuthStateChanged tetikleneceği için
      // RevenueCat'ten çıkış yapma ve state temizleme işlemleri orada halledilir.
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (user && !user.isAnonymous) {
      try {
        await initializeUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  const value = {
    user,
    loading,
    logout,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
