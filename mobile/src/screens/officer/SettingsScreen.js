import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { colors } from '../../utils/colors';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const confirm = useConfirm();

  const [pushAlerts, setPushAlerts] = useState(true);
  const [expiryReminders, setExpiryReminders] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  const name = user?.name || 'Dr. Nimal Perera';
  const email = user?.email || 'officer@hemogo.com';
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      destructive: true,
    });
    if (!ok) return;

    await logout();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const comingSoon = (label) => Alert.alert('Coming Soon', `${label} will be available soon.`);

  const Row = ({ icon, label, value, onPress, danger }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.primarySoft }]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.primary : colors.text}
        />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.primary }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress && !danger ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, value, onValueChange }) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'NP'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>Blood Bank Officer</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => comingSoon('Edit Profile')}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.group}>
          <ToggleRow
            icon="notifications-outline"
            label="Push Alerts"
            value={pushAlerts}
            onValueChange={setPushAlerts}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="hourglass-outline"
            label="Expiry Reminders"
            value={expiryReminders}
            onValueChange={setExpiryReminders}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="alert-outline"
            label="Low Stock Alerts"
            value={lowStockAlerts}
            onValueChange={setLowStockAlerts}
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.group}>
          <Row
            icon="person-outline"
            label="Edit Profile"
            onPress={() => comingSoon('Edit Profile')}
          />
          <View style={styles.divider} />
          <Row
            icon="business-outline"
            label="Hospital"
            value="Colombo General"
            onPress={() => comingSoon('Change Hospital')}
          />
          <View style={styles.divider} />
          <Row
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => comingSoon('Change Password')}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.group}>
          <Row
            icon="language-outline"
            label="Language"
            value="English"
            onPress={() => comingSoon('Language')}
          />
          <View style={styles.divider} />
          <Row
            icon="moon-outline"
            label="Dark Mode"
            value="Off"
            onPress={() => comingSoon('Dark Mode')}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.group}>
          <Row
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => comingSoon('Help')}
          />
          <View style={styles.divider} />
          <Row
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => comingSoon('Privacy')}
          />
          <View style={styles.divider} />
          <Row
            icon="information-circle-outline"
            label="App Version"
            value="v1.0.0"
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>HemoGo · Blood Donor Matching</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, paddingBottom: 40 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 20 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  roleText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 4,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 62 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: 4,
  },
  logoutText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
});

export default SettingsScreen;