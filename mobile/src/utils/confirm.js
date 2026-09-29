import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog.
 * - On web: uses window.confirm (blocking, returns boolean)
 * - On native: uses Alert.alert with OK/Cancel buttons
 *
 * Usage:
 *   const ok = await confirmDialog({ title, message, confirmText, destructive });
 *   if (!ok) return;
 */
export const confirmDialog = ({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
} = {}) => {
  if (Platform.OS === 'web') {
    const result =
      typeof window !== 'undefined'
        ? window.confirm(`${title}\n\n${message}`)
        : true;
    return Promise.resolve(result);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
};