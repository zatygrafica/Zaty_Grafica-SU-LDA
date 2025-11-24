const garbledPattern = /Ã|Â|Ê|Ô|Õ|Ú|¼|½|¾|Å|æ|œ|‰|™/;

const decodeUtf8Bytes = (input: string) => {
  try {
    const bytes = Uint8Array.from(Array.from(input, (char) => char.charCodeAt(0)));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return input;
  }
};

const shouldDecode = (value: string) => garbledPattern.test(value);

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, itemValue]) => {
        acc[key] = normalizeValue(itemValue);
        return acc;
      },
      {},
    );
  }

  if (typeof value === 'string' && shouldDecode(value)) {
    return decodeUtf8Bytes(value);
  }

  return value;
};

export const normalizeUtf8Translations = <T>(translations: T): T =>
  normalizeValue(translations) as T;
