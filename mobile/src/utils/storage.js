import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'hemogo_token';
const USER_KEY = 'hemogo_user';

export const saveSession = async (token, user) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const getToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSession = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter(
      (k) =>
        k === TOKEN_KEY ||
        k === USER_KEY ||
        k === 'HEMOGO_ACCEPTED_REQUESTS' ||
        k === 'HEMOGO_VERIFIED_REQUESTS' ||
        k.startsWith('HEMOGO_ACCEPTED_REQUESTS_') ||
        k.startsWith('HEMOGO_VERIFIED_REQUESTS_')
    );
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};
