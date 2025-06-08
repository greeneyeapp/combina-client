import { create } from 'zustand';
import { fetchCurrentWeather } from '@/services/weatherService';

export type Weather = {
  temperature: number;
  condition: string;
  location: string;
};

interface WeatherState {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  fetchWeather: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  loading: false,
  error: null,
  fetchWeather: async () => {
    set({ loading: true, error: null });
    try {
      const weather = await fetchCurrentWeather();
      set({ weather, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch weather', 
        loading: false 
      });
    }
  },
}));