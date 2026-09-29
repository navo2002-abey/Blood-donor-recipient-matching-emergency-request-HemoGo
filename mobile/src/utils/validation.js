export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

export const getApiErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Check your connection and API URL.';
  }

  return fallback || 'Something went wrong. Please try again.';
};

export const validateSignUp = ({ name, email, phone, password, confirmPassword, agreed }) => {
  if (!name.trim()) {
    return 'Please enter your full name.';
  }

  if (!email.trim()) {
    return 'Please enter your email address.';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address.';
  }

  if (!phone.trim()) {
    return 'Please enter your phone number.';
  }

  if (!password) {
    return 'Please enter a password.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (password !== confirmPassword) {
    return 'Password confirmation does not match.';
  }

  if (!agreed) {
    return 'Please agree to the Terms & Conditions and Privacy Policy.';
  }

  return null;
};
