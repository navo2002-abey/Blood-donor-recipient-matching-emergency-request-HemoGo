import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PhoneFrame from './src/components/PhoneFrame';
import { AlertsProvider } from './src/context/AlertsContext';
import { AuthProvider } from './src/context/AuthContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <PhoneFrame>
        <SafeAreaProvider>
          <LanguageProvider>
            <AuthProvider>
              <ConfirmProvider>
                <AlertsProvider>
                  <ToastProvider>
                    <ThemedStatusBar />
                    <AppNavigator />
                  </ToastProvider>
                </AlertsProvider>
              </ConfirmProvider>
            </AuthProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </PhoneFrame>
    </ThemeProvider>
  );
}