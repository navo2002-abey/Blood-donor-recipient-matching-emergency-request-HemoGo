import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PhoneFrame from './src/components/PhoneFrame';
import { AlertsProvider } from './src/context/AlertsContext';
import { AuthProvider } from './src/context/AuthContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PhoneFrame>
      <SafeAreaProvider>
        <AuthProvider>
          <ConfirmProvider>
            <AlertsProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AlertsProvider>
          </ConfirmProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PhoneFrame>
  );
}