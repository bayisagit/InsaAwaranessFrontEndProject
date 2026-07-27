import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { localeCodes, defaultLocale } from '@/config/locales';
import { mergeMessages } from '@/lib/i18n-utils';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !hasLocale(localeCodes, locale)) {
    locale = defaultLocale;
  }

  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    const fallbackMessages = (await import(`../messages/${defaultLocale}.json`)).default;

    if (locale === defaultLocale) {
      return { locale, messages };
    }

    const merged = mergeMessages(messages, fallbackMessages);
    return { locale, messages: merged };
  } catch {
    const messages = (await import(`../messages/${defaultLocale}.json`)).default;
    return { locale: defaultLocale, messages };
  }
});
