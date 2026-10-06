import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { createBloodRequest } from '../services/bloodRequestService';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const ConfirmBloodRequestScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { showToast } = useToast();
  const requestData = route?.params?.requestData || {
    patientName: 'Kasun Perera',
    hospital: 'National Hospital Colombo',
    bloodGroup: 'A+',
    units: 2,
    requiredDateTime: '16 Sep 2026, 10:00 AM',
    urgency: 'Critical',
    additionalInfo: '',
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return {
          title: 'Emergency Status - CRITICAL (Level 1)',
          subtitle: 'Immediate assistance required.',
          pillBg: colors.primary,
          pillText: '#FFFFFF',
          bannerBg: '#FFF1F3',
          bannerBorder: '#FAD4D8',
          iconColor: colors.primary,
        };
      case 'High':
        return {
          title: 'Priority Status - HIGH (Level 2)',
          subtitle: 'Donors will be prioritized for notification within 2 hours.',
          pillBg: '#EA580C',
          pillText: '#FFFFFF',
          bannerBg: '#FFF7ED',
          bannerBorder: '#FED7AA',
          iconColor: '#EA580C',
        };
      case 'Medium':
        return {
          title: 'Status - MEDIUM URGENCY',
          subtitle: 'Standard matching cycle in progress.',
          pillBg: '#F59E0B',
          pillText: '#FFFFFF',
          bannerBg: '#FEFCE8',
          bannerBorder: '#FEF08A',
          iconColor: '#D97706',
        };
      case 'Low':
      default:
        return {
          title: 'Status - SCHEDULED REQUEST',
          subtitle: 'Routine blood preparation requirement.',
          pillBg: '#4B5563',
          pillText: '#FFFFFF',
          bannerBg: '#F3F4F6',
          bannerBorder: '#E5E7EB',
          iconColor: '#6B7280',
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(requestData.urgency);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await createBloodRequest(requestData);
      const generatedId =
        res?.data?._id && !res.data._id.startsWith('req_')
          ? `REQ-2026-${String(res.data._id).slice(-3).toUpperCase()}`
          : 'REQ-2026-001';

      showToast({
        type: requestData.urgency === 'Critical' ? 'emergency' : 'success',
        title:
          requestData.urgency === 'Critical'
            ? '🚨 Emergency Request Broadcasted!'
            : 'Blood Request Created',
        message: `${requestData.bloodGroup} request for ${requestData.hospital} is live and notifying donors.`,
        duration: 5000,
        onPress: () =>
          navigation.navigate('TrackingRequest', {
            requestData,
            requestId: generatedId,
          }),
      });

      navigation.navigate('TrackingRequest', {
        requestData,
        requestId: generatedId,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>{t('pages.confirmRequest')}</Text>
          <Text style={styles.heroSub}>
            Please review the details before submitting.
          </Text>
        </View>

        {/* Details Summary Card */}
        <View style={styles.detailsCard}>
          {/* Patient Name */}
          <View style={styles.detailRow}>
            <Text style={styles.fieldLabel}>PATIENT NAME</Text>
            <Text style={styles.fieldValue}>{requestData.patientName}</Text>
          </View>

          <View style={styles.divider} />

          {/* Hospital */}
          <View style={styles.detailRow}>
            <Text style={styles.fieldLabel}>HOSPITAL</Text>
            <Text style={styles.fieldValue}>{requestData.hospital}</Text>
          </View>

          <View style={styles.divider} />

          {/* Blood Group */}
          <View style={styles.detailRow}>
            <Text style={styles.fieldLabel}>REQUIRED BLOOD GROUP</Text>
            <Text style={[styles.fieldValue, styles.bloodGroupValue]}>
              {requestData.bloodGroup}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Quantity */}
          <View style={styles.detailRow}>
            <Text style={styles.fieldLabel}>QUANTITY (UNITS)</Text>
            <Text style={styles.fieldValue}>{requestData.units}</Text>
          </View>

          <View style={styles.divider} />

          {/* Date / Time */}
          <View style={styles.detailRow}>
            <Text style={styles.fieldLabel}>REQUIRED DATE/TIME</Text>
            <Text style={styles.fieldValue}>{requestData.requiredDateTime}</Text>
          </View>

          <View style={styles.divider} />

          {/* Urgency Level */}
          <View style={[styles.detailRow, { paddingBottom: 4 }]}>
            <Text style={styles.fieldLabel}>URGENCY LEVEL</Text>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: urgencyConfig.pillBg },
              ]}
            >
              <Text
                style={[
                  styles.urgencyBadgeText,
                  { color: urgencyConfig.pillText },
                ]}
              >
                {requestData.urgency || 'Medium'}
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency Status Alert Box */}
        <View
          style={[
            styles.alertBanner,
            {
              backgroundColor: urgencyConfig.bannerBg,
              borderColor: urgencyConfig.bannerBorder,
            },
          ]}
        >
          <Ionicons
            name="warning"
            size={18}
            color={urgencyConfig.iconColor}
            style={{ marginTop: 2, marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.alertTitle,
                { color: urgencyConfig.iconColor },
              ]}
            >
              {urgencyConfig.title}
            </Text>
            <Text style={styles.alertSubtitle}>
              {urgencyConfig.subtitle}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  detailRow: {
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  bloodGroupValue: {
    color: colors.primary,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#4B5563',
  },
  actionContainer: {
    gap: 10,
  },
  primaryBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 50,
    backgroundColor: colors.cardBg,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConfirmBloodRequestScreen;
