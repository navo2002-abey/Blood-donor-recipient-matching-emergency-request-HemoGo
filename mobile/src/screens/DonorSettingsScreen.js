import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguagePicker from '../components/LanguagePicker';
import ThemePicker from '../components/ThemePicker';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'hemogo_donor_settings';
const DEFAULTS = {
  emergencyAlerts: true,
  appointmentReminders: true,
  rewardUpdates: true,
};

const DonorSettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch (error) {
        // Keep the default switches if saved settings cannot be read.
      }
    };
    load();
  }, []);

  const updateSetting = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      Alert.alert(t('common.saveFailed'), t('common.saveFailedMessage'));
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
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.donorSubtitle')}</Text>

        <Text style={styles.section}>{t('settings.notifications')}</Text>
        <View style={styles.group}>
          <SettingSwitch
            icon="alert-circle-outline"
            label={t('settings.emergency')}
            hint={t('settings.emergencyDonor')}
            value={settings.emergencyAlerts}
            onValueChange={(value) => updateSetting('emergencyAlerts', value)}
          />
          <View style={styles.divider} />
          <SettingSwitch
            icon="calendar-outline"
            label={t('settings.appointments')}
            hint={t('settings.appointmentsHint')}
            value={settings.appointmentReminders}
            onValueChange={(value) => updateSetting('appointmentReminders', value)}
          />
          <View style={styles.divider} />
          <SettingSwitch
            icon="ribbon-outline"
            label={t('settings.rewards')}
            hint={t('settings.rewardsHint')}
            value={settings.rewardUpdates}
            onValueChange={(value) => updateSetting('rewardUpdates', value)}
          />
        </View>

        <Text style={styles.section}>{t('settings.preferences')}</Text>
        <LanguagePicker />
        <ThemePicker />

        <Text style={styles.section}>{t('settings.about')}</Text>
        <View style={styles.group}>
          <AboutRow
            icon="help-circle-outline"
            label={t('settings.help')}
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <View style={styles.divider} />
          <AboutRow
            icon="document-text-outline"
            label={t('settings.privacy')}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <View style={styles.divider} />
          <AboutRow icon="information-circle-outline" label={t('settings.version')} value={t('settings.versionValue')} />
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(feature) => Alert.alert('Coming Soon', `${feature} will be available in a later version.`)}
        activeKey="Settings"
        showAvailability
      />
    </SafeAreaView>
  );
};

const AboutRow = ({ icon, label, value, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value ? <Text style={styles.rowHint}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

const SettingSwitch = ({ icon, label, hint, value, onValueChange }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={colors.text} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowHint}>{hint}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#D1D5DB', true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
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
  title: { fontSize: 22, lineHeight: 32, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, marginBottom: 16, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  section: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 4,
  },
  group: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1 },
  rowLabel: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: colors.text },
  rowHint: { fontSize: 12, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 62 },
});

export default DonorSettingsScreen;
