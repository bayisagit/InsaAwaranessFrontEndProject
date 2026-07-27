import { locales, type LocaleConfig } from './locales';

const availableCodes = ['en', 'am', 'om', 'ti', 'ar', 'sw'];

export const availableLocales: LocaleConfig[] = locales.filter(l =>
  availableCodes.includes(l.code)
);
