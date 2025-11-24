export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  // Remove all non-digit characters and limit to 9 digits
  return value.replace(/\D/g, '').slice(0, 9);
};

export const formatDigitsOnly = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};
