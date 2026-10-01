import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BloodDrop } from './Logo';
import { useAlerts } from '../context/AlertsContext';
import { colors } from '../utils/colors';

/**
 * Reusable top header.
 *
 * Usage:
 *   Direct screen:  <AppHeader navigation={navigation} onMenuPress={() => setSidebarOpen(true)} />
 *   Stack screen:   <AppHeader navigation={navigation} showBack />
 *   No bell:        <AppHeader navigation={navigation} showBell={false} />
 */
const AppHeader = ({
  navigation,
  onMenuPress,
  onBackPress,
  onBellPress,
  showBack = false,
  showBell = true,
}) => {
  const { unreadCount } = useAlerts();

  const handleLeft = () => {
    if (showBack) {
      if (onBackPress) onBackPress();
      else navigation.goBack();
    } else {
      if (onMenuPress) onMenuPress();
      else navigation.navigate('OfficerTabs', { screen: 'Home' });
    }
  };

  const handleBell = () => {
    if (onBellPress) onBellPress();
    else navigation.navigate('Alerts');
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity hitSlop={10} style={styles.headerBtn} onPress={handleLeft}>
        <Ionicons
          name={showBack ? 'arrow-back' : 'menu-outline'}
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>

      <View style={styles.brand}>
        <BloodDrop size={16} />
        <Text style={styles.brandText}>HemoGo</Text>
      </View>

      {showBell ? (
        <TouchableOpacity hitSlop={10} style={styles.headerBtn} onPress={handleBell}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});

export default AppHeader;