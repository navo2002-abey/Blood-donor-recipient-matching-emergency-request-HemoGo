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

export const validateSignUp = ({ name, email, phone, password, confirmPassword, agreed }, t = (key) => key) => {
  if (!name.trim()) {
    return t('pages.nameRequired');
  }

  if (!email.trim()) {
    return t('pages.emailRequired');
  }

  if (!isValidEmail(email)) {
    return t('pages.emailInvalid');
  }

  if (!phone.trim()) {
    return t('pages.phoneRequired');
  }

  if (!password) {
    return t('pages.passwordRequired');
  }

  if (password.length < 6) {
    return t('pages.passwordShort');
  }

  if (password !== confirmPassword) {
    return t('pages.passwordMismatch');
  }

  if (!agreed) {
    return t('pages.termsRequired');
  }

  return null;
};
