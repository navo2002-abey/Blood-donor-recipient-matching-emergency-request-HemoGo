import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { forgotPassword } from '../services/authService';
import { getApiErrorMessage, isValidEmail } from '../utils/validation';

const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !phone.trim() || !newPassword) {
      Alert.alert(t('login.missingTitle'), t('login.forgotMissing'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert(t('login.missingTitle'), t('pages.emailInvalid'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('login.missingTitle'), t('pages.passwordShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('login.missingTitle'), t('pages.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({
        email: email.trim(),
        phone: phone.trim(),
        newPassword,
      });
      Alert.alert(t('login.resetDone'), t('login.resetDoneMessage'), [
        { text: t('login.login'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert(t('login.resetFailed'), getApiErrorMessage(error, t('login.resetFailedMessage')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('login.forgotTitle')}</Text>
          <Text style={styles.subtitle}>{t('login.forgotHint')}</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('pages.email')}
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder={t('pages.phone')}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('login.newPassword')}
            secureTextEntry
            editable={!loading}
          />
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('pages.confirmPassword')}
            secureTextEntry
            editable={!loading}
          />
          <Button title={t('login.reset')} onPress={handleReset} loading={loading} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 24,
  },
});

export default ForgotPasswordScreen;
