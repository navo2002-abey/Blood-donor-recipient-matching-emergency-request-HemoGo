import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getApiErrorMessage } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('login.missingTitle'), t('login.missingMessage'));
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert(t('login.failedTitle'), getApiErrorMessage(error, t('login.failedMessage')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View style={styles.langSwitch}>
              <TouchableOpacity onPress={() => setLanguage('en')}>
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
              </TouchableOpacity>
              <Text style={styles.langDivider}>|</Text>
              <TouchableOpacity onPress={() => setLanguage('si')}>
                <Text style={[styles.langText, language === 'si' && styles.langTextActive]}>සිංහල</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.topLink} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.topLinkText}>{t('login.signUp')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.center}>
            <Logo />
            <Text style={styles.heading}>{t('login.welcome')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('login.emailPhone')}
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password')}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>{t('login.forgot')}</Text>
          </TouchableOpacity>

          <Button title={t('login.login')} onPress={handleLogin} loading={loading} disabled={loading} />
        </ScrollView>

        <View style={styles.bottom}>
          <Text style={styles.bottomText}>{t('login.noAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomLink}>{t('login.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langText: { fontSize: 13, lineHeight: 20, fontWeight: '700', color: colors.textMuted },
  langTextActive: { color: colors.primary },
  langDivider: { color: colors.textMuted },
  topLink: {
    paddingVertical: 8,
  },
  topLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  heading: {
    marginTop: 18,
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -6,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  bottomText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  bottomLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default LoginScreen;
