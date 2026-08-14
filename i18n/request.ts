import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { localeCodes, defaultLocale } from '@/config/locales';
import { mergeMessages } from '@/lib/i18n-utils';

import { cookies } from 'next/headers';

const getMessages = async (locale: string) => {
  switch (locale) {
    case 'am':
      return (await import('@messages/am.json')).default;
    case 'om':
      return (await import('@messages/om.json')).default;
    case 'sw':
      return (await import('@messages/sw.json')).default;
    case 'so':
      return (await import('@messages/so.json')).default;
    case 'en':
    default:
      return (await import('@messages/en.json')).default;
  }
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;

  if (!locale || !hasLocale(localeCodes, locale)) {
    locale = defaultLocale;
  }

  try {
    const messages = await getMessages(locale);
    const fallbackMessages = await getMessages(defaultLocale);

    if (locale === defaultLocale) {
      return { locale, messages };
    }

    const merged = mergeMessages(messages, fallbackMessages);
    return { locale, messages: merged };
  } catch {
    const messages = await getMessages(defaultLocale);
    return { locale: defaultLocale, messages };
  }
});
