// kodlar/store/clothingStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  imageUri: string; // Galeri referansı
  createdAt: string;
};

interface ClothingState {
  clothing: ClothingItem[];
  isValidated: boolean;
  isValidating: boolean;
  setClothing: (newClothing: ClothingItem[]) => void; // YENİ FONKSİYON
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
  validateClothingImages: () => Promise<{ removedCount: number } | void>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
}

// Görsel URI'sinin hala geçerli olup olmadığını kontrol et
const checkImageExists = async (imageUri: string): Promise<boolean> => {
  try {
    // HTTP/HTTPS URL'leri için
    if (imageUri.startsWith('http')) {
      return true; // Network URL'leri için varsayılan olarak true döndür
    }
    
    // File system URI'leri için basit bir kontrol
    if (imageUri.startsWith('file://')) {
      const response = await fetch(imageUri, { method: 'HEAD' });
      return response.ok;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking image exists for URI: ${imageUri}`, error);
    return false;
  }
};

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,
      
      // YENİ FONKSİYONUN TANIMI
      setClothing: (newClothing) => set({ clothing: newClothing }),
      
      addClothing: (item) => set((state) => {
        return { clothing: [...state.clothing, item] };
      }),
      
      removeClothing: (id) => set((state) => ({
        clothing: state.clothing.filter((item) => item.id !== id)
      })),
      
      updateClothing: (id, updatedItem) => set((state) => ({
        clothing: state.clothing.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
      })),
      
      clearAllClothing: () => set({ 
        clothing: [],
        isValidated: false 
      }),
      
      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),
      
      validateClothingImages: async () => {
        const { clothing, isValidated, isValidating } = get();
        
        if (isValidated || isValidating) return;
        
        set({ isValidating: true });
                
        try {
          if (clothing.length === 0) {
            set({ isValidated: true, isValidating: false });
            return;
          }
          
          const validItems: ClothingItem[] = [];
          let removedCount = 0;
          
          for (const item of clothing) {
            const exists = await checkImageExists(item.imageUri);
            if (exists) {
              validItems.push(item);
            } else {
              removedCount++;
              console.warn(`Removing item ${item.name} - image no longer exists`);
            }
          }
          
          if (removedCount > 0) {
            set({ 
              clothing: validItems,
              isValidated: true,
              isValidating: false 
            });
            return { removedCount };
          } else {
            set({ 
              isValidated: true,
              isValidating: false 
            });
            console.log('All clothing images are valid');
          }
          
        } catch (error) {
          console.error('Error validating images:', error);
          set({ 
            isValidated: true,
            isValidating: false 
          }); 
        }
      }
    }),
    {
      name: 'clothing-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;
        }
      },
    }
  )
);