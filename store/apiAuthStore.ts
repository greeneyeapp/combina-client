import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'api_jwt_token';

interface ApiAuthState {
  jwt: string | null;
  setJwt: (token: string) => Promise<void>;
  clearJwt: () => Promise<void>;
  loadJwt: () => Promise<void>;
  isReady: boolean;
}

export const useApiAuthStore = create<ApiAuthState>((set) => ({
  jwt: null,
  isReady: false,
  setJwt: async (token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ jwt: token });
  },
  clearJwt: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ jwt: null });
  },
  loadJwt: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ jwt: token, isReady: true });
  },
}));