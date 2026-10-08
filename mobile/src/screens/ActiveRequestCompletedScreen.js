import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const formatTime = (dateVal, fallback) => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fallback;
  }
};

const ActiveRequestCompletedScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const requestData = route?.params?.requestData || {};
  const acceptedTime =
    route?.params?.acceptedTime ||
    formatTime(requestData.acceptedAt, new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const verifiedTime =
    route?.params?.verifiedTime ||
    formatTime(requestData.verifiedAt, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const handleGoToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.iconBtnPlaceholder} />
        <Text style={styles.headerTitle}>{t('pages.activeRequest')}</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Center Hero Celebration Section */}
        <View style={styles.heroSection}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.completedTitle}>Completed</Text>
          <Text style={styles.completedSub}>You helped to save a life.</Text>
        </View>

        {/* Completed Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Completed ...</Text>

          {/* Step 1: Accepted Request (Done on screen 3 with real time) */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconWrapActive}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Accepted Request</Text>
              <Text style={styles.stepSubtitle}>You accepted the request.</Text>
            </View>
            <Text style={styles.stepTimeText}>{acceptedTime}</Text>
          </View>

          {/* Step 2: Verify (Done on screen 3 with real time) */}
          <View style={[styles.stepRow, { marginBottom: 2 }]}>
            <View style={styles.stepIconWrapActive}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify</Text>
              <Text style={styles.stepSubtitle}>You are verified.</Text>
            </View>
            <Text style={styles.stepTimeText}>{verifiedTime}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Dark Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={handleGoToDashboard}
          activeOpacity={0.85}
        >
          <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
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
    backgroundColor: colors.cardBg,
  },
  iconBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 36,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  completedSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  timelineCard: {
    width: '100%',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  stepIconWrapActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepTimeText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.cardBg,
  },
  dashboardBtn: {
    height: 52,
    backgroundColor: '#1E293B',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  dashboardBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ActiveRequestCompletedScreen;
