// utils/appInitialization.ts
import { ensureImageDirectoryExists } from '@/utils/optimizedImageStorage';

// Uygulama başlangıcında çalışacak doğrulama fonksiyonu
export const initializeApp = async () => {
  try {
    
    // Görsel klasörünü oluştur
    await ensureImageDirectoryExists();
    
    
  } catch (error) {
    
  }
};