import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';
import { DONOR_MENU, ROLE_LABELS } from '../utils/roles';

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
  const { user, logout } = useAuth();
  const [available, setAvailable] = useState(false);
  const isStaff = variant === 'staff';
  const isOfficer = user?.role === 'BLOOD_BANK_OFFICER';
  const rawName =
    user?.name || (isOfficer ? 'Nimal Perera' : isStaff ? 'Anusha Fernando' : 'HemoGo User');
  const name =
    isOfficer && !/^dr\.?\s/i.test(rawName) ? `Dr. ${rawName}` : rawName || 'HemoGo User';
  const roleLabel = ROLE_LABELS[user?.role] || 'HemoGo User';
  const subtitle = user?.role === 'DONOR' ? `${user?.bloodGroup || 'O+'} Blood Group` : roleLabel;
  const orgLine = org || hospital;

  const handleItem = (item) => {
    onClose();
    if (item.screen) {
      navigation.navigate(item.screen);
      return;
    }
    if (item.tab) {
      const routeNames = navigation.getState?.()?.routeNames || [];
      if (routeNames.includes(item.tab)) {
        navigation.navigate(item.tab);
      } else {
        navigation.navigate('Main', { screen: item.tab });
      }
      return;
    }
    onComingSoon(item.key);
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
            {isStaff ? <View style={[styles.staffBar, active && styles.staffBarActive]} /> : null}
            <Text style={[textStyle, active && activeTextStyle]}>{item.key}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[itemStyle, isStaff && styles.staffLogoutItem]}
        onPress={handleLogout}
      >
        {isStaff ? <View style={styles.staffBar} /> : null}
        <Text style={textStyle}>Log Out</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView
          style={[styles.panel, isStaff && styles.staffPanel]}
          edges={['top', 'bottom']}
        >
          {isStaff ? (
            <>
              <View style={styles.staffTopRow}>
                <View />
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.staffProfile}>
                <View style={styles.staffAvatarRing}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{getInitials(name) || 'AF'}</Text>
                  </View>
                </View>
                <Text style={styles.staffName}>{name}</Text>
                <Text style={styles.staffHospital}>{orgLine}</Text>
                <Text style={styles.staffRole}>Role: {roleLabel}</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.staffMenu}>
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
                  <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.group}>{subtitle}</Text>
                </View>
                <View style={styles.bellWrap}>
                  <Ionicons name="notifications-outline" size={20} color={colors.white} />
                  <View style={styles.badge} />
                </View>
              </View>

              <View style={styles.search}>
                <Ionicons name="search-outline" size={16} color={colors.sidebarMuted} />
                <TextInput
                  placeholder=""
                  placeholderTextColor={colors.sidebarMuted}
                  style={styles.searchInput}
                  editable={false}
                />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menu}>
                {renderMenu(styles.menuItem, styles.menuText)}
              </ScrollView>

              {showAvailability ? (
                <View style={styles.footer}>
                  <Text style={styles.footerLabel}>{available ? 'Active' : 'Inactive'}</Text>
                  <Switch
                    value={available}
                    onValueChange={setAvailable}
                    trackColor={{ false: '#374151', true: colors.primary }}
                    thumbColor={colors.white}
                  />
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
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
  search: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.white,
    paddingVertical: 0,
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
    fontWeight: '500',
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
    backgroundColor: colors.white,
  },
  staffItemText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontWeight: '500',
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
