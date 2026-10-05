import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

const CHOOSE_ACCOUNT = 'com.google.android.gms.common.account.CHOOSE_ACCOUNT';

const readEmail = (result) => {
  const extra = result?.extra || {};
  const value = extra.authAccount || extra.accountName || extra.email;
  return typeof value === 'string' ? value.trim() : '';
};

export const pickGoogleAccount = async () => {
  if (Platform.OS !== 'android') {
    return null;
  }

  const options = {
    category: 'android.intent.category.DEFAULT',
    extra: { alwaysPromptForAccount: true },
  };

  let result;
  try {
    result = await IntentLauncher.startActivityAsync(CHOOSE_ACCOUNT, {
      ...options,
      extra: {
        allowableAccountTypes: ['com.google'],
        alwaysPromptForAccount: true,
      },
    });
  } catch (error) {
    result = await IntentLauncher.startActivityAsync(CHOOSE_ACCOUNT, options);
  }

  if (Number(result?.resultCode) !== -1) {
    return null;
  }

  const email = readEmail(result);
  if (!email) {
    throw new Error('NO_ACCOUNT_EMAIL');
  }

  return email;
};
