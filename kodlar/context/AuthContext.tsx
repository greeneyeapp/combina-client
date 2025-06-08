import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, User, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyBoA4DhHFqkzBBIHzxpWsN4HehBDp24T-0",
  authDomain: "combina-7b033.firebaseapp.com",
  projectId: "combina-7b033",
  storageBucket: "combina-7b033.appspot.com",
  messagingSenderId: "58339241217",
  appId: "1:58339241217:web:5bb6c34c4686c0c62dbf00"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const firestore = getFirestore(app);

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
