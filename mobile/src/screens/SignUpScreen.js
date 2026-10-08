import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
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
import AppleSignInSheet from '../components/AppleSignInSheet';
import Button from '../components/Button';
import GoogleLogo from '../components/GoogleLogo';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { pickGoogleAccount } from '../utils/googleAccount';
import { getApiErrorMessage, validateSignUp } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const SignUpScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { register, socialLogin } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleOpen, setAppleOpen] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const finishApple = async () => {
    setAppleOpen(false);
    try {
      setAppleLoading(true);
      const available = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
      if (!available) {
        navigation.navigate('SocialContinue', { provider: 'apple' });
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const given = credential.fullName?.givenName || '';
      const family = credential.fullName?.familyName || '';
      const name = `${given} ${family}`.trim();
      const email = credential.email || '';
      const data = await socialLogin({
        provider: 'apple',
        email: email || undefined,
        name: name || undefined,
        appleId: credential.user,
      });
      if (data.token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }
      navigation.navigate('SocialContinue', {
        provider: 'apple',
        email,
        name,
        appleId: credential.user,
      });
    } catch (error) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert(t('login.failedTitle'), getApiErrorMessage(error, t('login.appleFailed')));
    } finally {
      setAppleLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      const email = await pickGoogleAccount();
      if (!email) {
        return;
      }

      const name = email.split('@')[0].replace(/[._]/g, ' ');
      const data = await socialLogin({ provider: 'google', email, name });
      if (data.token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      navigation.navigate('SocialContinue', { provider: 'google', email, name });
    } catch (error) {
      const message = error?.message === 'NO_ACCOUNT_EMAIL'
        ? t('login.googleNoEmail')
        : getApiErrorMessage(error, t('login.googlePickerFailed'));
      Alert.alert(t('login.failedTitle'), message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    const validationError = validateSignUp(
      {
        name,
        email,
        phone,
        password,
        confirmPassword,
        agreed,
      },
      t
    );

    if (validationError) {
      Alert.alert(t('pages.checkDetails'), validationError);
      return;
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'DONOR',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert(
        t('pages.registerFailed'),
        getApiErrorMessage(error, t('pages.registerFailedMsg'))
      );
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('pages.createAccount')}</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label={t('pages.fullName')}
            value={name}
            onChangeText={setName}
            placeholder={t('pages.fullName')}
            autoCapitalize="words"
            hint={t('pages.nameHint')}
            editable={!loading}
          />
          <Input
            label={t('pages.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('pages.email')}
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            label={t('pages.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('pages.phone')}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Input
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password')}
            secureTextEntry
            editable={!loading}
          />
          <Input
            label={t('pages.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('pages.confirmPassword')}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed((prev) => !prev)}
            disabled={loading}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>{t('pages.terms')}</Text>
          </TouchableOpacity>

          <Button
            title={t('pages.createAccount')}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.submit}
          />

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={continueWithGoogle}
            disabled={loading || googleLoading}
          >
            <GoogleLogo size={18} />
            <Text style={styles.socialText}>{t('login.continueGoogle')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => {
              if (Platform.OS === 'ios') {
                setAppleOpen(true);
                return;
              }
              navigation.navigate('AppleAccount');
            }}
            disabled={loading || appleLoading}
          >
            <Ionicons name="logo-apple" size={20} color={colors.text} />
            <Text style={styles.socialText}>{t('login.continueApple')}</Text>
          </TouchableOpacity>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>{t('pages.haveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLink}>{t('login.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppleSignInSheet
        visible={appleOpen}
        onClose={() => setAppleOpen(false)}
        onContinue={finishApple}
        onPrivacy={() => {
          setAppleOpen(false);
          navigation.navigate('PrivacyPolicy');
        }}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 22,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  submit: {
    marginTop: 8,
  },
  socialBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  socialText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
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

export default SignUpScreen;
