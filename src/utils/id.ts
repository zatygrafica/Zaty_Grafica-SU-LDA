export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const generateNumericCode = (length: number) => {
  const fallback = () =>
    Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    return fallback();
  }

  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(randomValues, (value) => (value % 10).toString()).join('');
};
