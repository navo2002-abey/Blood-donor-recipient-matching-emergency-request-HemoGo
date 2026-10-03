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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import GoogleLogo from '../components/GoogleLogo';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getApiErrorMessage, isValidEmail } from '../utils/validation';

const SocialContinueScreen = ({ navigation, route }) => {
  const provider = route.params?.provider === 'apple' ? 'apple' : 'google';
  const lockedEmail = route.params?.email || '';
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { socialLogin } = useAuth();
  const [name, setName] = useState(route.params?.name || '');
  const [email, setEmail] = useState(lockedEmail);
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [loading, setLoading] = useState(false);

  const title = provider === 'apple' ? t('login.continueApple') : t('login.continueGoogle');

  const handleContinue = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert(t('login.missingTitle'), t('login.socialMissing'));
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert(t('login.missingTitle'), t('pages.emailInvalid'));
      return;
    }

    try {
      setLoading(true);
      const data = await socialLogin({
        provider,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        appleId: route.params?.appleId || undefined,
      });
      if (!data.token) {
        Alert.alert(t('login.failedTitle'), t('login.failedMessage'));
        return;
      }
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.badge}>
            {provider === 'apple' ? (
              <Ionicons name="logo-apple" size={22} color={colors.text} />
            ) : (
              <GoogleLogo size={22} />
            )}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{lockedEmail ? t('login.googleChosenHint') : t('login.socialHint')}</Text>
          {lockedEmail ? (
            <View style={styles.account}>
              <Text style={styles.accountLabel}>{t('login.googleChosen')}</Text>
              <Text style={styles.accountEmail}>{lockedEmail}</Text>
            </View>
          ) : null}
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('pages.fullName')}
            editable={!loading}
          />
          {lockedEmail ? null : (
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t('pages.email')}
              keyboardType="email-address"
              editable={!loading}
            />
          )}
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder={t('pages.phone')}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Button title={title} onPress={handleContinue} loading={loading} disabled={loading} />
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
    marginBottom: 8,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: colors.cardBg,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
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
  account: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: colors.cardBg,
  },
  accountLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
});

export default SocialContinueScreen;
