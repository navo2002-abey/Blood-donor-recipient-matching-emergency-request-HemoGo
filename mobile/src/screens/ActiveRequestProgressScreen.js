import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { useUserLocation } from '../hooks/useUserLocation';
import { acceptBloodRequest } from '../services/bloodRequestService';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const formatDisplayDate = (dateStr, fallback = '18 Sep 2026 • 09:42 AM') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
};

const ActiveRequestProgressScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { location } = useUserLocation();

  const requestData = route?.params?.requestData || {
    patientName: 'Kasun Perera',
    hospital: 'National Hospital, Colombo',
    bloodGroup: 'A+',
    units: 1,
    requiredDateTime: '18 Sep 2026 • 09:42 AM',
    urgency: 'High',
    additionalInfo: 'Patient with low hemoglobin. Needs urgent support.',
    createdAt: new Date().toISOString(),
  };

  const rawRequestId =
    route?.params?.requestId ||
    requestData._id ||
    'RG-2025-1042';

  const cleanId = String(rawRequestId).replace(/^#/, '');

  // Step state: 1: Accepted, 2: Arrived, 3: Verified, 4: Done
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = async () => {
    const acceptedTime =
      requestData.acceptedAt
        ? new Date(requestData.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark as accepted in backend
    try {
      acceptBloodRequest(cleanId).catch(() => {});
    } catch {}

    const updatedData = {
      ...requestData,
      status: 'ACCEPTED',
      acceptedAt: requestData.acceptedAt || new Date().toISOString(),
    };

    navigation.navigate('ActiveRequestQRVerify', {
      requestData: updatedData,
      requestId: cleanId,
      verifierId: requestData.verifierId || '#NHC01078',
      acceptedTime,
      isOwner: route?.params?.isOwner || false,
      isAcceptedDonor: true,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('pages.activeRequest')}</Text>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Card */}
        <View style={styles.mapCard}>
          <LiveDonorsMap
            location={location}
            donors={[
              {
                name: requestData.patientName || 'Patient',
                bloodGroup: requestData.bloodGroup || 'A+',
                latitude: location.latitude + 0.005,
                longitude: location.longitude + 0.006,
              },
            ]}
            interactive={false}
            style={styles.mapElement}
          />

          {/* Hospital Overlay Badge */}
          <View style={styles.hospitalBadge}>
            <View style={styles.hospitalIconWrap}>
              <Ionicons name="business" size={16} color="#111827" />
            </View>
            <Text style={styles.hospitalBadgeText} numberOfLines={1}>
              {requestData.hospital || 'National Hospital'}
            </Text>
          </View>

          {/* Center Pin Marker */}
          <View style={styles.centerPinMarker} pointerEvents="none">
            <Ionicons name="location" size={32} color={colors.primary} />
          </View>
        </View>

        {/* Request Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Request Summary</Text>

          {/* Blood Type Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Blood Type</Text>
            <Text style={styles.bloodTypeValue}>{requestData.bloodGroup || 'A+'}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Units Required Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>
              {requestData.fulfilledUnits > 0 ? 'Units Remaining' : 'Units Required'}
            </Text>
            <Text style={[styles.rowValue, requestData.fulfilledUnits > 0 && { color: '#D97706', fontWeight: '700' }]}>
              {requestData.fulfilledUnits > 0
                ? `${Math.max(0, (requestData.units || 1) - (requestData.fulfilledUnits || 0))} of ${requestData.units || 1} units`
                : `${requestData.units || 1} ${requestData.units === 1 ? 'unit' : 'units'}`}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Location Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Location</Text>
            <Text style={[styles.rowValue, styles.locationValue]}>
              {requestData.hospital || 'No. 12, Park Road, Colombo 07, Sri Lanka'}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Additional Details Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Additional Details</Text>
            <Text style={[styles.rowValue, styles.detailsValue]}>
              {requestData.additionalInfo || 'Patient with low hemoglobin. Needs urgent support.'}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Request ID Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Request ID</Text>
            <Text style={styles.requestIdValue}>#{cleanId}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Requested At Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Requested At</Text>
            <Text style={styles.rowValue}>
              {formatDisplayDate(requestData.createdAt || requestData.requiredDateTime)}
            </Text>
          </View>
        </View>

        {/* What happens next? Timeline Card (Both Pending on Screen 1) */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>What happens next?</Text>

          {/* Step 1: Accepted Request (Pending on screen 1) */}
          <View style={styles.stepRow}>
            <View style={styles.stepIconWrapPending} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Accepted Request</Text>
              <Text style={styles.stepSubtitle}>You accept the request.</Text>
            </View>
            <Text style={styles.stepStatusText}>Pending</Text>
          </View>

          {/* Step 2: Verify (Pending on screen 1) */}
          <View style={[styles.stepRow, { marginBottom: 4 }]}>
            <View style={styles.stepIconWrapPending} />
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify</Text>
              <Text style={styles.stepSubtitle}>You are verified.</Text>
            </View>
            <Text style={styles.stepStatusText}>Pending</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons (Back & Next) */}
      <View style={styles.bottomBar}>
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            style={styles.whiteBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.whiteBtnText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.redBtn}
            onPress={handleNextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.redBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  mapCard: {
    height: 195,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#111827',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  mapElement: {
    ...StyleSheet.absoluteFillObject,
  },
  hospitalBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxWidth: '80%',
    gap: 6,
  },
  hospitalIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  centerPinMarker: {
    position: 'absolute',
    top: '40%',
    left: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 0.45,
  },
  rowValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    flex: 0.55,
    textAlign: 'right',
  },
  bloodTypeValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    flex: 0.55,
    textAlign: 'right',
  },
  locationValue: {
    lineHeight: 18,
  },
  detailsValue: {
    lineHeight: 18,
    fontWeight: '600',
  },
  requestIdValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 0.55,
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(243, 244, 246, 0.6)',
    marginVertical: 4,
  },
  timelineCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
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
  stepIconWrapPending: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
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
  stepStatusText: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepStatusInProgress: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepStatusDone: {
    color: colors.primary,
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  actionButtonsCol: {
    gap: 12,
  },
  whiteBtn: {
    height: 48,
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  redBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  redBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ActiveRequestProgressScreen;
