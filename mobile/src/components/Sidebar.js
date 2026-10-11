import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { colors } from '../utils/colors';
import { DONOR_MENU, ROLE_LABELS } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';
import AvailabilityStatusChip from './AvailabilityStatusChip';

const getInitials = (name) =>
  name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const Sidebar = ({
  visible,
  onClose,
  navigation,
  onComingSoon,
  menu = DONOR_MENU,
  showAvailability = false,
  variant = 'default',
  activeKey,
  hospital = 'Colombo National Hospital',
  org,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { hasUnread } = useNotifications();
  const [available, setAvailable] = useState(false);
  const isStaff = variant === 'staff';
  const isOfficer = user?.role === 'BLOOD_BANK_OFFICER';
  const rawName =
    user?.name ||
    (isOfficer ? 'Nimal Perera' : isStaff ? 'Anusha Fernando' : 'HemoGo User');
  const name =
    isOfficer && !/^dr\.?\s/i.test(rawName)
      ? `Dr. ${rawName}`
      : rawName || 'HemoGo User';
  const roleLabel = (user?.role && t(`roles.${user.role}`)) || ROLE_LABELS[user?.role] || 'HemoGo User';
  const subtitle =
    user?.role === 'DONOR' ? `${user?.bloodGroup || 'O+'} Blood Group` : roleLabel;
  const orgLine = org || hospital;

  const handleItem = (item) => {
    onClose();

    // 1. Stack-level screen (ExpiryMonitoring, AIPrediction, etc.)
    if (item.screen) {
      if (item.params) {
        navigation.navigate(item.screen, item.params);
      } else {
        navigation.navigate(item.screen);
      }
      return;
    }

    // 2. Legacy donor flow
    if (item.key === 'Create Request' || item.key === 'Request Blood') {
      navigation.navigate('CreateBloodRequest');
      return;
    }

    if (item.key === 'History') {
      navigation.navigate('History');
      return;
    }

    // 3. Tab-level navigation — bulletproof
    if (item.tab) {
      // Get current navigator state
      const state = navigation.getState?.();

      // ✅ Correct check: does the CURRENT navigator own this tab route?
      const currentRouteNames = state?.routeNames || [];

      if (currentRouteNames.includes(item.tab)) {
        // We're already inside the tab navigator (or it owns this route)
        // → direct tab switch
        navigation.navigate(item.tab);
        return;
      }

      // Otherwise we're on a stack screen — go through OfficerTabs
      // (for officer) or Main (for donor)
      const officerTabsAvailable =
        state?.routeNames?.includes('OfficerTabs');

      if (officerTabsAvailable) {
        navigation.navigate('OfficerTabs', { screen: item.tab });
        return;
      }

      // Fallback for donor flow
      navigation.navigate('Main', { screen: item.tab });
      return;
    }

    onComingSoon(item.key);
  };

  const handleNotificationPress = () => {
    onClose();
    if (!navigation) return;

    // Check if current navigator has Notifications
    const state = navigation.getState?.();
    const routeNames = state?.routeNames || [];

    if (routeNames.includes('Notifications')) {
      navigation.navigate('Notifications');
      return;
    }

    // Try parent navigator if nested inside tabs
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('Notifications');
      return;
    }

    navigation.navigate('Notifications');
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    const parent = navigation.getParent?.();
    const navigator = parent || navigation;
    navigator.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const renderMenu = (itemStyle, textStyle, activeStyle, activeTextStyle) => (
    <>
      {menu.map((item) => {
        const active = item.key === activeKey;
        return (
          <TouchableOpacity
            key={item.key}
            style={[itemStyle, active && activeStyle]}
            onPress={() => handleItem(item)}
          >
            {isStaff ? (
              <View style={[styles.staffBar, active && styles.staffBarActive]} />
            ) : null}
            <Text style={[textStyle, active && activeTextStyle]}>{t(`menu.${item.key}`)}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[itemStyle, isStaff && styles.staffLogoutItem]}
        onPress={handleLogout}
      >
        {isStaff ? <View style={styles.staffBar} /> : null}
        <Text style={textStyle}>{t('common.logout')}</Text>
      </TouchableOpacity>
    </>
  );

  const panelContent = (
    <View style={styles.overlay}>
      <SafeAreaView
        style={[styles.panel, isStaff && styles.staffPanel]}
        edges={['top', 'bottom']}
      >
        {isStaff ? (
          <>
            <View style={styles.staffTopRow}>
              <TouchableOpacity
                style={styles.bellWrap}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
                {hasUnread ? <View style={styles.badge} /> : null}
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.staffProfile}>
              <View style={styles.staffAvatarRing}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>
                    {getInitials(name) || 'AF'}
                  </Text>
                </View>
              </View>
              <Text style={styles.staffName}>{name}</Text>
              <Text style={styles.staffHospital}>{orgLine}</Text>
              <Text style={styles.staffRole}>Role: {roleLabel}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.staffMenu}
            >
              {renderMenu(
                styles.staffItem,
                styles.staffItemText,
                styles.staffItemActive,
                styles.staffItemTextActive
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.topRow}>
              <View />
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.group}>{subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.bellWrap}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Notifications"
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.white}
                />
                {hasUnread ? <View style={styles.badge} /> : null}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menu}
            >
              {renderMenu(styles.menuItem, styles.menuText)}
            </ScrollView>

            {showAvailability || user?.role === 'DONOR' ? (
              <View style={[styles.footer, { justifyContent: 'space-between' }]}>
                <Text style={styles.footerLabel}>Availability</Text>
                <AvailabilityStatusChip variant="compact" />
              </View>
            ) : (
              <View style={styles.footer}>
                <Text style={styles.footerLabel}>{roleLabel}</Text>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
      <Pressable style={styles.dim} onPress={onClose} />
    </View>
  );

  // Web: render inside the phone frame with absolute positioning
  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={styles.webWrap} pointerEvents="box-none">
        {panelContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {panelContent}
    </Modal>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  webWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  panel: {
    width: '78%',
    backgroundColor: colors.sidebar,
    paddingHorizontal: 22,
  },
  staffPanel: {
    width: '76%',
    backgroundColor: colors.sidebarStaff,
    paddingHorizontal: 0,
  },
  dim: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  group: {
    color: colors.sidebarMuted,
    fontSize: 12,
    marginTop: 3,
  },
  bellWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  menu: {
    paddingBottom: 16,
  },
  menuItem: {
    paddingVertical: 13,
  },
  menuText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    paddingRight: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  footerLabel: {
    color: colors.sidebarMuted,
    fontSize: 13,
  },
  staffTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 10,
    paddingTop: 2,
  },
  staffProfile: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 22,
  },
  staffAvatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  staffAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#2A4566',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  staffName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  staffHospital: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  staffRole: {
    color: colors.sidebarRole,
    fontSize: 12,
    marginTop: 5,
  },
  staffMenu: {
    paddingBottom: 24,
  },
  staffItem: {
    minHeight: 46,
    paddingVertical: 12,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffItemActive: {
    backgroundColor: colors.sidebarStaffActive,
  },
  staffBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    marginRight: 19,
    backgroundColor: 'transparent',
  },
  staffBarActive: {
    backgroundColor: colors.cardBg,
  },
  staffItemText: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    paddingRight: 16,
  },
  staffItemTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  staffLogoutItem: {
    marginTop: 6,
  },
});

export default Sidebar;