// store/clothingStore.ts (Güncellenmiş tam kod)
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { 
  validateClothingImages, 
  deleteImageFile,
  cleanupMissingImages 
} from '@/utils/optimizedImageStorage';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  imageUri: string;
  createdAt: string;
};

interface ClothingState {
  clothing: ClothingItem[];
  isValidated: boolean; // Görsellerin doğrulanıp doğrulanmadığını takip et
  isValidating: boolean; // Doğrulama işlemi devam ediyor mu
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
  validateAndCleanImages: () => Promise<void>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
}

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,
      
      addClothing: (item) => set((state) => {
        return { clothing: [...state.clothing, item] };
      }),
      
      removeClothing: (id) => set((state) => {
        // Kaldırılan öğenin görselini de sil
        const itemToRemove = state.clothing.find(item => item.id === id);
        if (itemToRemove) {
          deleteImageFile(itemToRemove.imageUri).catch(console.error);
        }
        
        return {
          clothing: state.clothing.filter((item) => item.id !== id)
        };
      }),
      
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
      
      validateAndCleanImages: async () => {
        const { clothing, isValidated, isValidating } = get();
        
        // Eğer zaten doğrulanmışsa veya doğrulama devam ediyorsa, çık
        if (isValidated || isValidating) return;
        
        set({ isValidating: true });
                
        try {
          if (clothing.length === 0) {
            set({ isValidated: true, isValidating: false });
            return;
          }
          
          const validItems = await cleanupMissingImages(clothing);
          
          if (validItems.length !== clothing.length) {
            const removedCount = clothing.length - validItems.length;
            console.warn(`Removing ${removedCount} items with missing images`);
            
            // Geçerli öğeleri store'da tut
            set({ 
              clothing: validItems,
              isValidated: true,
              isValidating: false 
            });
            
            // Kullanıcıya toast bildirimi göster (bu fonksiyon çağrıldığında gösterilecek)
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
      
      // Store yüklendiğinde görsel doğrulamayı sıfırla
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;
        }
      },
    }
  )
);