import { create } from 'zustand';

type AlertButton = {
  text: string;
  onPress: () => void;
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
  buttons: AlertButton[];
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
    buttons,
  }),
  hide: () => set({
    isVisible: false,
    title: '',
    message: '',
    buttons: [],
  }),
}));

export default useAlertStore;