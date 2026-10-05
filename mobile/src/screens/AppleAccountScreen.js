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
import Input from '../components/Input';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getApiErrorMessage, isValidEmail } from '../utils/validation';

const AppleAccountScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { socialLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const continueWithAccount = async () => {
    const value = identifier.trim();
    const isEmail = value.includes('@');
    if (isEmail && !isValidEmail(value)) {
      Alert.alert(t('login.missingTitle'), t('pages.emailInvalid'));
      return;
    }
    if (!isEmail && value.replace(/\D/g, '').length < 9) {
      Alert.alert(t('login.missingTitle'), t('login.appleNeedId'));
      return;
    }

    try {
      setLoading(true);
      const data = await socialLogin({
        provider: 'apple',
        email: isEmail ? value : undefined,
        phone: isEmail ? undefined : value,
        name: isEmail ? value.split('@')[0].replace(/[._]/g, ' ') : undefined,
      });
      if (data.token) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        return;
      }
      navigation.navigate('SocialContinue', {
        provider: 'apple',
        email: isEmail ? value : '',
        name: isEmail ? value.split('@')[0].replace(/[._]/g, ' ') : '',
        phone: isEmail ? '' : value,
      });
    } catch (error) {
      Alert.alert(t('login.failedTitle'), getApiErrorMessage(error, t('login.appleFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('login.appleAccount')}</Text>
          <View style={styles.backBtn} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <BloodDrop size={42} />
          </View>
          <Text style={styles.prompt}>{t('login.appleUse')}</Text>
          <Input
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t('login.appleEmailPhone')}
            keyboardType="email-address"
            editable={!loading}
          />
          <View style={styles.note}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>
              {t('login.appleFine')}{' '}
              <Text style={styles.noteLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                {t('login.appleData')}
              </Text>
            </Text>
          </View>
          <Button
            title={t('login.appleContinue')}
            onPress={continueWithAccount}
            loading={loading}
            disabled={loading || !identifier.trim()}
          />
          <TouchableOpacity
            style={styles.iphoneBtn}
            onPress={() => Alert.alert(t('login.appleIphone'), t('login.appleIosNote'))}
            disabled={loading}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={colors.text} />
            <Text style={styles.iphoneText}>{t('login.appleIphone')}</Text>
          </TouchableOpacity>
          <Text style={styles.iphoneNote}>{t('login.appleIosNote')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  headerTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  logoWrap: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  prompt: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 22,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  noteLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  iphoneBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  iphoneText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  iphoneNote: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default AppleAccountScreen;
