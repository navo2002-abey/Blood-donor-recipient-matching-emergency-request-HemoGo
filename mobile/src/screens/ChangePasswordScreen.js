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
import { useLanguage } from '../context/LanguageContext';
import { changePassword } from '../services/authService';
import { colors } from '../utils/colors';
import { getApiErrorMessage } from '../utils/validation';
import { useTheme } from '../context/ThemeContext';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t('account.updateFailed'), t('account.passwordRequired'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('account.updateFailed'), t('account.passwordShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('account.updateFailed'), t('account.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      Alert.alert(t('account.passwordSaved'), t('account.passwordSavedMsg'), [
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
          <Text style={styles.title}>{t('account.changePassword')}</Text>
          <Input
            label={t('account.currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('account.currentPassword')}
            secureTextEntry
            editable={!loading}
          />
          <Input
            label={t('account.newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('account.newPassword')}
            secureTextEntry
            editable={!loading}
          />
          <Input
            label={t('account.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('account.confirmPassword')}
            secureTextEntry
            editable={!loading}
          />
          <Button
            title={t('account.updatePassword')}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
          />
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

export default ChangePasswordScreen;
