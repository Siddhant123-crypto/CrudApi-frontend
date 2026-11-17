import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import bn from './locales/bn.json';
import kn from './locales/kn.json';
import or from './locales/or.json';
import sa from './locales/sa.json';
import te from './locales/te.json';

import {
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_SELECTED_KEY,
  DEFAULT_LANGUAGE,
  normalizeLanguageCode,
} from './languages.ts';
export * from './languages.ts';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ta: { translation: ta },
  bn: { translation: bn },
  kn: { translation: kn },
  or: { translation: or },
  sa: { translation: sa },
  te: { translation: te },
};

// Initialize i18next synchronously with default English, then hydrate from AsyncStorage
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

/**
 * Returns stored language code or default 'en'
 */
export const getStoredLanguage = async (): Promise<string> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return normalizeLanguageCode(lang);
  } catch (e) {
    console.warn('Error reading stored language:', e);
    return DEFAULT_LANGUAGE;
  }
};

/**
 * Persists and applies language change across the app
 */
export const setAppLanguage = async (languageCode: string): Promise<void> => {
  try {
    const validCode = normalizeLanguageCode(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, validCode);
    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
    await i18n.changeLanguage(validCode);
  } catch (e) {
    console.error('Error saving app language:', e);
  }
};

/**
 * Checks if user has already gone through first-launch language selection
 */
export const hasUserSelectedLanguage = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

/**
 * Hydrates language from storage on app launch
 */
export const initAppLanguage = async (): Promise<string> => {
  const lang = await getStoredLanguage();
  if (i18n.language !== lang) {
    await i18n.changeLanguage(lang);
  }
  return lang;
};

export default i18n;
