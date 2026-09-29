import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PhoneFrame from './src/components/PhoneFrame';
import { AuthProvider } from './src/context/AuthContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PhoneFrame>
      <SafeAreaProvider>
        <AuthProvider>
          <ConfirmProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </ConfirmProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PhoneFrame>
  );
}