// Dosya: kodlar/utils/fileSystemStorage.ts (GÜNCELLENMİŞ VE DOĞRU VERSİYON)

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

const WARDROBE_DATA_FILE = FileSystem.documentDirectory + 'wardrobe_data_v2.json'; // v2'ye güncelledik

// Zustand'ın persist middleware'i için özel storage adaptörü
export const fileSystemStorage: StateStorage = {
  /**
   * Veriyi dosyaya yazar.
   */
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Gelen değer zaten string olduğu için doğrudan yazıyoruz.
      await FileSystem.writeAsStringAsync(WARDROBE_DATA_FILE, value);
    } catch (error) {
      console.error(`FileSystemStorage (setItem) Hata:`, error);
    }
  },

  /**
   * Veriyi dosyadan okur. Migrasyon mantığı burada.
   */
  getItem: async (name: string): Promise<string | null> => {
    try {
      // 1. Yeni dosya sisteminden veriyi oku.
      const fileContent = await FileSystem.readAsStringAsync(WARDROBE_DATA_FILE);
      return fileContent;
    } catch (e) {
      // Dosya yoksa, eski sistemi (AsyncStorage) kontrol et.
      console.log('FileSystemStorage: Dosya bulunamadı, AsyncStorage migrasyonu deneniyor...');
      
      try {
        // 2. Zustand'ın AsyncStorage'a kaydettiği anahtarla veriyi oku.
        const asyncStorageKey = `persist:${name}`; // Zustand bu şekilde key oluşturur.
        const asyncStorageData = await AsyncStorage.getItem(asyncStorageKey);
        
        if (asyncStorageData) {
          console.log('FileSystemStorage: Eski veri bulundu ve yeni sisteme taşınıyor.');
          // 3. Bulunan veriyi HİÇ DEĞİŞTİRMEDEN yeni dosyaya yaz.
          // Bu veri zaten string formatında bir JSON objesidir.
          await fileSystemStorage.setItem(name, asyncStorageData);
          
          // 4. Eski veriyi temizle.
          await AsyncStorage.removeItem(asyncStorageKey);
          
          return asyncStorageData;
        } else {
          console.log('FileSystemStorage: Eski sistemde de veri bulunamadı.');
          return null;
        }
      } catch (error) {
        console.error(`FileSystemStorage (Migration) Hata:`, error);
        return null;
      }
    }
  },

  /**
   * Veriyi dosyadan siler.
   */
  removeItem: async (name: string): Promise<void> => {
    try {
      await FileSystem.deleteAsync(WARDROBE_DATA_FILE, { idempotent: true });
    } catch (error) {
      console.error(`FileSystemStorage (removeItem) Hata:`, error);
    }
  },
};