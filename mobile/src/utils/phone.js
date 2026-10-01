import { Alert, Linking } from 'react-native';

export const placeCall = async (phone) => {
  const number = String(phone || '').replace(/[^\d+]/g, '');
  if (!number) {
    Alert.alert('No number', 'This donor does not have a phone number.');
    return;
  }

  try {
    await Linking.openURL(`tel:${number}`);
  } catch (error) {
    Alert.alert('Unable to call', 'Phone calls are not available on this device.');
  }
};
