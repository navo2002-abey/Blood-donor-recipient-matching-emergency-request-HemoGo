/**
 * Strips all non-digit characters from a string.
 * Use for numeric-only inputs (units, quantity, etc.)
 */
export const digitsOnly = (text) => String(text ?? '').replace(/[^0-9]/g, '');

/**
 * Returns true if the value is a positive integer (> 0).
 */
export const isPositiveInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
};