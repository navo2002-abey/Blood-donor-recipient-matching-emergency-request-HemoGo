import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';
import { colors } from '../utils/colors';
import { ROLE_LABELS, ROLES } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const confirm = useConfirm();
  const isAdmin = user?.role === ROLES.ADMIN;
  const name = user?.name || (isAdmin ? 'Anusha Fernando' : 'Amal Silva');
  const email = user?.email || (isAdmin ? 'admin@hemogo.com' : 'donor@hemogo.com');
  const phone = user?.phone || (isAdmin ? '0770000001' : '0770000002');
  const bloodGroup = user?.bloodGroup || 'O+';
  const roleLabel = (user?.role && t(`roles.${user.role}`)) || ROLE_LABELS[user?.role] || (isAdmin ? 'System Admin' : 'Donor');
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const details = isAdmin
    ? [
        { icon: 'mail-outline', label: t('profile.email'), value: email, tint: '#EFF6FF', color: '#2563EB' },
        { icon: 'call-outline', label: t('profile.phone'), value: phone, tint: '#F0FDF4', color: '#16A34A' },
        { icon: 'business-outline', label: t('profile.organization'), value: t('profile.orgValue'), tint: '#FFF7ED', color: '#EA580C' },
        { icon: 'shield-checkmark-outline', label: t('profile.role'), value: roleLabel, tint: colors.primarySoft, color: colors.primary },
      ]
    : [
        { icon: 'mail-outline', label: t('profile.email'), value: email, tint: '#EFF6FF', color: '#2563EB' },
        { icon: 'call-outline', label: t('profile.phone'), value: phone, tint: '#F0FDF4', color: '#16A34A' },
        { icon: 'water-outline', label: t('profile.bloodGroupLabel'), value: bloodGroup, tint: colors.primarySoft, color: colors.primary },
        { icon: 'checkmark-circle-outline', label: t('profile.status'), value: t('profile.availableToDonate'), tint: '#F0FDF4', color: '#16A34A' },
      ];

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('common.logoutTitle'),
      message: t('common.logoutMessage'),
      confirmText: t('common.logout'),
      destructive: true,
    });
    if (!ok) return;

    await logout();
    const parent = navigation.getParent?.();
    const navigator = parent || navigation;
    navigator.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brand}>
            <BloodDrop size={16} />
            <Text style={styles.brandText}>{t('profile.title')}</Text>
          </View>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'HG'}</Text>
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.rolePill}>
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : 'heart'}
              size={12}
              color={colors.primary}
            />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.highlight}>
          <View style={styles.highlightIcon}>
            <Ionicons
              name={isAdmin ? 'people-outline' : 'water'}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.highlightCopy}>
            <Text style={styles.highlightLabel}>{isAdmin ? t('profile.network') : t('profile.bloodGroup')}</Text>
            <Text style={styles.highlightValue}>{isAdmin ? t('profile.nationalNetwork') : bloodGroup}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{isAdmin ? t('profile.active') : t('profile.available')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        <View style={styles.group}>
          {details.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: item.tint }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowValue}>{item.value}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.group, styles.actionGroup]}>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('EditProfile')}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{t('account.editProfile')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={[styles.rowIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>{t('account.changePassword')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  scroll: {
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
  },
  brandText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 28,
  },
  name: {
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#111111',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  highlightIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightCopy: {
    flex: 1,
    marginLeft: 12,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  highlightValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  group: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  actionGroup: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    marginLeft: 12,
  },
  rowLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: '600',
  },
  rowValue: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 26,
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  logoutText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default ProfileScreen;
