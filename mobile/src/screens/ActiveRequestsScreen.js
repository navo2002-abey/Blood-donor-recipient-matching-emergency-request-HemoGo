import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../utils/colors';

const ActiveRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { hasUnread } = useNotifications();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header identical to FindDonorsScreen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {hasUnread ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

      {/* Main Content with 2 Red Action Blocks */}
      <View style={styles.content}>
        {/* 1. My Requests Block */}
        <TouchableOpacity
          style={styles.cardBlock}
          onPress={() => navigation.navigate('MyRequests')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-outline" size={28} color="#FFFFFF" style={styles.cardIcon} />
          <Text style={styles.cardText}>My Requests</Text>
        </TouchableOpacity>

        {/* 2. All Requests Block */}
        <TouchableOpacity
          style={styles.cardBlock}
          onPress={() => navigation.navigate('BloodRequestList', { filterMode: 'all' })}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={28} color="#FFFFFF" style={styles.cardIcon} />
          <Text style={styles.cardText}>All Requests</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    headerBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellBadge: {
      position: 'absolute',
      top: 6,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.cardBg || colors.white,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandText: {
      color: colors.primary,
      fontSize: 18,
      fontWeight: '800',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 32,
      paddingBottom: 60,
    },
    cardBlock: {
      width: 200,
      height: 160,
      backgroundColor: colors.primary,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    cardIcon: {
      marginBottom: 8,
    },
    cardText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
    },
  });

export default ActiveRequestsScreen;
