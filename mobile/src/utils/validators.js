/**
 * Shared form validators.
 * Each returns an error string, or null if valid.
 */

export const required = (value, label = 'This field') => {
  if (!value || String(value).trim() === '') {
    return `${label} is required.`;
  }
  return null;
};

export const minLength = (value, min, label = 'This field') => {
  if (!value || String(value).trim().length < min) {
    return `${label} must be at least ${min} characters.`;
  }
  return null;
};

export const maxLength = (value, max, label = 'This field') => {
  if (value && String(value).trim().length > max) {
    return `${label} must be under ${max} characters.`;
  }
  return null;
};

export const positiveInt = (value, label = 'Value') => {
  const n = Number(value);
  if (!value || value === '' || !Number.isInteger(n) || n <= 0) {
    return `${label} must be a positive whole number.`;
  }
  if (n > 9999) {
    return `${label} cannot exceed 9999.`;
  }
  return null;
};

export const email = (value) => {
  if (!value) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(String(value).trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export const futureDate = (value, label = 'Date') => {
  if (!value) return `${label} is required.`;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return `Please pick a valid ${label.toLowerCase()}.`;
  }
  // Allow today, but not before
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) {
    return `${label} cannot be in the past.`;
  }
  return null;
};

export const notPastDate = (value, label = 'Date') => {
  return futureDate(value, label);
};

/**
 * Run a list of validators against a value.
 * Returns the first error found or null.
 */
export const runValidators = (value, validators) => {
  for (const v of validators) {
    const err = v(value);
    if (err) return err;
  }
  return null;
};