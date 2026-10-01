/**
 * Normalizes a stock object — ensures all values are numbers.
 * Handles: numbers, strings, missing keys, non-numeric values.
 */
export const normalizeStock = (stock) => {
  if (!stock || typeof stock !== 'object' || Array.isArray(stock)) return {};
  const out = {};
  Object.entries(stock).forEach(([key, value]) => {
    const n = Number(value);
    out[key] = Number.isFinite(n) ? n : 0;
  });
  return out;
};

export const totalUnits = (stock) =>
  Object.values(normalizeStock(stock)).reduce((sum, n) => sum + n, 0);

export const groupsWithStock = (stock) =>
  Object.entries(normalizeStock(stock))
    .filter(([_, n]) => n > 0)
    .map(([g]) => g);