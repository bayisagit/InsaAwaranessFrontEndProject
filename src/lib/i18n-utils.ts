function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasTodoPrefix(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('TODO_TRANSLATION_');
}

export function mergeMessages(
  localeMessages: Record<string, unknown>,
  fallbackMessages: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const allKeys = new Set([
    ...Object.keys(localeMessages),
    ...Object.keys(fallbackMessages),
  ]);

  for (const key of allKeys) {
    const localeVal = localeMessages[key];
    const fallbackVal = fallbackMessages[key];

    if (isObject(localeVal) && isObject(fallbackVal)) {
      result[key] = mergeMessages(localeVal, fallbackVal);
    } else if (hasTodoPrefix(localeVal) || localeVal === undefined) {
      result[key] = fallbackVal;
    } else {
      result[key] = localeVal;
    }
  }

  return result;
}
