export const LANGUAGE_STORAGE_KEY = '@farm2home_app_language';
export const LANGUAGE_SELECTED_KEY = '@farm2home_language_selected';
export const DEFAULT_LANGUAGE = 'en';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  tagline: string;
  script: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', tagline: 'Default language', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', tagline: 'खेत से घर तक', script: 'देवनागरी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', tagline: 'शेतातून थेट घरापर्यंत', script: 'देवनागरी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', tagline: 'பண்ணையிலிருந்து வீட்டிற்கு', script: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', tagline: 'খামার থেকে সরাসরি ঘরে', script: 'বাংলা' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', tagline: 'ಹೊಲದಿಂದ ನೇರವಾಗಿ ಮನೆಗೆ', script: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', tagline: 'କ୍ଷେତରୁ ସିଧାସଳଖ ଘରକୁ', script: 'ଓଡ଼ିଆ' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', tagline: 'क्षेत्रात् साक्षात् गृहम् प्रति', script: 'देवनागरी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', tagline: 'పొలం నుండి నేరుగా ఇంటికి', script: 'తెలుగు' },
];

export const normalizeLanguageCode = (code: string | null | undefined): string => {
  if (!code) return DEFAULT_LANGUAGE;
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return match ? match.code : DEFAULT_LANGUAGE;
};
