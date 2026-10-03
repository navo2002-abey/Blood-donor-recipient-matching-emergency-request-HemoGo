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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { getApiErrorMessage, validateSignUp } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const SignUpScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

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
            <Text style={styles.backArrow}>←</Text>
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

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>{t('pages.haveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLink}>{t('login.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
