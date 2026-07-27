export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const locales: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', direction: 'ltr' },
  { code: 'om', name: 'Afaan Oromoo', nativeName: 'Afaan Oromoo', direction: 'ltr' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', direction: 'ltr' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', direction: 'ltr' },
  { code: 'sid', name: 'Sidama', nativeName: 'Sidama', direction: 'ltr' },
  { code: 'aa', name: 'Afar', nativeName: 'Afar', direction: 'ltr' },
  { code: 'har', name: 'Harari', nativeName: 'ሃረሪ', direction: 'ltr' },
  { code: 'wal', name: 'Wolaytta', nativeName: 'Wolaytta', direction: 'ltr' },
  { code: 'gura', name: 'Guragigna', nativeName: 'ጉራጊኛ', direction: 'ltr' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
];

export const defaultLocale = 'en';
export const localeCodes = locales.map(l => l.code);
