// utils/simpleStorage.ts - Basit AsyncStorage wrapper (fileSystemStorage replacement)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Basit AsyncStorage wrapper - artık galeri referansları kullandığımız için
 * karmaşık file system storage'a gerek yok.
 */
export const simpleStorage: StateStorage = {
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`SimpleStorage (setItem) Error:`, error);
    }
  },

  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (error) {
      console.error(`SimpleStorage (getItem) Error:`, error);
      return null;
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`SimpleStorage (removeItem) Error:`, error);
    }
  },
};