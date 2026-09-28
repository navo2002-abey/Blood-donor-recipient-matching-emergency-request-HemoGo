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
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
