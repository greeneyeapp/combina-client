// Dosya: kodlar/store/alertStore.ts (GÜNCEL VE GÜVENLİ VERSİYON)

import { create } from 'zustand';

type AlertButton = {
  text: string;
  // `onPress` fonksiyonunu opsiyonel hale getiriyoruz.
  onPress?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
};

type AlertConfig = {
  title: string;
  message: string;
  buttons: AlertButton[];
};

interface AlertState {
  isVisible: boolean;
  title: string;
  message: string;
  buttons: Required<AlertButton>[]; // Butonların her zaman dolu olmasını sağlıyoruz.
  show: (config: AlertConfig) => void;
  hide: () => void;
}

const useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  show: ({ title, message, buttons }) => set({
    isVisible: true,
    title,
    message,
    // Her butona, eğer bir onPress'i yoksa, varsayılan olarak boş bir fonksiyon ata.
    buttons: buttons.map(btn => ({
        ...btn,
        onPress: btn.onPress || (() => {}), // Çökmeyi engelleyen anahtar satır
        variant: btn.variant || 'primary',
    })),
  }),
  hide: () => set({
    isVisible: false,
    title: '',
    message: '',
    buttons: [],
  }),
}));

export default useAlertStore;