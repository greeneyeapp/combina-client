import { Weather } from '@/store/weatherStore';

// Maps OpenWeatherMap conditions to simplified weather conditions
export function getWeatherCondition(weather: Weather | null): string {
  if (!weather) return 'sunny'; // Default

  const { temperature, condition } = weather;

  // Determine temperature category
  let temperatureCategory = 'warm';
  if (temperature < 5) temperatureCategory = 'cold';
  else if (temperature < 15) temperatureCategory = 'cool';
  else if (temperature < 25) temperatureCategory = 'warm';
  else temperatureCategory = 'hot';

  // Map weather condition to simplified categories
  let weatherCategory = 'sunny';
  if (condition.includes('rain')) weatherCategory = 'rainy';
  else if (condition.includes('snow')) weatherCategory = 'snowy';
  else if (condition.includes('cloud')) weatherCategory = 'cloudy';
  else if (condition.includes('clear')) weatherCategory = 'sunny';

  // For this app, we'll prioritize the temperature feeling over the condition
  // This helps with outfit suggestions that are temperature-appropriate
  return temperatureCategory;
}