import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import tr from './tr.json';
import bg from './bg.json';
import el from './el.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import ar from './ar.json';
import he from './he.json';
import hi from './hi.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import pt from './pt.json';
import ru from './ru.json';
import tl from './tl.json';
import zh from './zh.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  bg: { translation: bg },
  el: { translation: el },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  he: { translation: he },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  pt: { translation: pt },
  ru: { translation: ru },
  tl: { translation: tl },
  zh: { translation: zh },
};

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.error('Error reading language from AsyncStorage:', error);
    }
    return callback('en');
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('language', language);
    } catch (error) {
      console.error('Error saving language to AsyncStorage:', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;