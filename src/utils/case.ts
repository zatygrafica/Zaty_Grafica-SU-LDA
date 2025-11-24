const camelRegex = /[_-]([a-z])/g;

const toCamelCase = (key: string) => key.replace(camelRegex, (_, chr) => chr.toUpperCase());

const toSnakeCase = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

export const convertKeysToCamelCase = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input.map((item) => convertKeysToCamelCase(item)) as T;
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[toCamelCase(key)] = convertKeysToCamelCase(value);
      return acc;
    }, {}) as T;
  }

  return input;
};

export const convertKeysToSnakeCase = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input.map((item) => convertKeysToSnakeCase(item)) as T;
  }

  if (isPlainObject(input)) {
    return Object.entries(input).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[toSnakeCase(key)] = convertKeysToSnakeCase(value);
      return acc;
    }, {}) as T;
  }

  return input;
};

