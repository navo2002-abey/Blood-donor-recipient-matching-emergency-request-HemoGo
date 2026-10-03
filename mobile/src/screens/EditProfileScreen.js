import { Ionicons } from '@expo/vector-icons';
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
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { getApiErrorMessage, isValidEmail } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, saveProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert(t('account.updateFailed'), t('account.fillRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(t('account.updateFailed'), t('account.emailInvalid'));
      return;
    }

    try {
      setLoading(true);
      await saveProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      Alert.alert(t('account.profileSaved'), t('account.profileSavedMsg'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('account.updateFailed'), getApiErrorMessage(error, t('account.updateFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('account.editProfile')}</Text>
          <Input
            label={t('account.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('account.name')}
            autoCapitalize="words"
            editable={!loading}
          />
          <Input
            label={t('account.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('account.email')}
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            label={t('account.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('account.phone')}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Button title={t('account.save')} onPress={handleSave} loading={loading} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 22, lineHeight: 32, fontWeight: '800', color: colors.text, marginBottom: 16 },
});

export default EditProfileScreen;
