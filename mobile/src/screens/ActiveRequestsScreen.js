import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const ActiveRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('pages.activeRequests')}</Text>

        <View style={styles.placeholderBtn} />
      </View>

      {/* Main Content with 2 Red Action Blocks */}
      <View style={styles.content}>
        {/* 1. My Requests Block */}
        <TouchableOpacity
          style={styles.cardBlock}
          onPress={() => navigation.navigate('MyRequests')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardText}>My Requests</Text>
        </TouchableOpacity>

        {/* 2. All Requests Block */}
        <TouchableOpacity
          style={styles.cardBlock}
          onPress={() => navigation.navigate('BloodRequestList', { filterMode: 'all' })}
          activeOpacity={0.85}
        >
          <Text style={styles.cardText}>All Requests</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
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
  cardText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default ActiveRequestsScreen;
