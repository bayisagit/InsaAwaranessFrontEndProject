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
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', direction: 'ltr' },
];

export const defaultLocale = 'en';
export const localeCodes = locales.map(l => l.code);
