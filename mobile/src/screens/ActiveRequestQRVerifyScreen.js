import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { verifyBloodRequest, saveMyAcceptedId, saveMyVerifiedId } from '../services/bloodRequestService';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const getDerivedVerifierId = (hospitalName) => {
  if (!hospitalName) return '#NHC01078';
  const words = hospitalName.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  let prefix = 'NHC';
  if (words.length >= 3) {
    prefix = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    prefix = (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  } else if (words[0]) {
    prefix = words[0].slice(0, 3).toUpperCase();
  }
  return `#${prefix}01078`;
};

const ActiveRequestQRVerifyScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const requestData = route?.params?.requestData || {
    patientName: 'Kasun Perera',
    hospital: 'National Hospital Colombo',
    bloodGroup: 'A+',
    units: 1,
    requiredDateTime: '18 Sep 2026 • 09:42 AM',
    urgency: 'High',
  };

  const rawRequestId =
    route?.params?.requestId ||
    requestData._id ||
    'RG-2025-1042';

  const cleanId = String(rawRequestId).replace(/^#/, '');
  const hospitalName = requestData.hospital || 'National Hospital Colombo';
  const verifierId =
    requestData.verifierId ||
    route?.params?.verifierId ||
    getDerivedVerifierId(hospitalName);

  const acceptedTime =
    route?.params?.acceptedTime ||
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [isVerified, setIsVerified] = useState(
    requestData.status === 'VERIFIED' || false
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedTime, setVerifiedTime] = useState(
    requestData.verifiedAt
      ? new Date(requestData.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Automatically record this donation as accepted by the current donor
  React.useEffect(() => {
    const userKey = user?.email || user?.id || user?._id;
    if (cleanId && userKey) {
      saveMyAcceptedId(cleanId, userKey);
    }
  }, [cleanId, user]);

  // Dynamic QR Code payload encoded with live request details
  const qrPayload = JSON.stringify({
    type: 'HEMOGO_DONATION_VERIFICATION',
    requestId: cleanId,
    hospital: hospitalName,
    bloodGroup: requestData.bloodGroup || 'A+',
    units: requestData.units || 1,
    verifierId: verifierId,
    acceptedTime: acceptedTime,
    timestamp: new Date().toISOString(),
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}&margin=10`;

  const handleSimulateHospitalScan = async () => {
    setIsVerifying(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVerifiedTime(nowTime);

    const userKey = user?.email || user?.id || user?._id;
    if (cleanId && userKey) {
      await saveMyVerifiedId(cleanId, userKey);
    }

    try {
      await verifyBloodRequest(cleanId, { verifierId }, userKey);
      setIsVerified(true);
      setTimeout(() => {
        navigation.navigate('ActiveRequestCompleted', {
          requestData: {
            ...requestData,
            status: 'VERIFIED',
          },
          acceptedTime,
          verifiedTime: nowTime,
        });
      }, 700);
    } catch {
      setIsVerified(true);
      setTimeout(() => {
        navigation.navigate('ActiveRequestCompleted', {
          requestData,
          acceptedTime,
          verifiedTime: nowTime,
        });
      }, 700);
    } finally {
      setIsVerifying(false);
    }
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
        {/* Hospital Title & Verifier ID */}
        <View style={styles.titleSection}>
          <Text style={styles.hospitalTitle}>{hospitalName}</Text>
          <Text style={styles.verifierText}>
            Verifier ID: <Text style={styles.verifierBold}>{verifierId}</Text>
          </Text>
        </View>

        {/* QR Code Container */}
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: qrUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </View>

        {/* What happens next? Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>What happens next?</Text>

          {/* Step 1: Accepted Request (Done on screen 2 with real time) */}
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

          {/* Step 2: Verify (Pending on screen 2 until scanned) */}
          <View style={[styles.stepRow, { marginBottom: 2 }]}>
            <View
              style={[
                styles.stepIconWrapPending,
                isVerified && styles.stepIconWrapActive,
              ]}
            >
              {isVerified ? (
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              ) : null}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify</Text>
              <Text style={styles.stepSubtitle}>
                {isVerified ? 'Donation verified successfully.' : 'You are verified.'}
              </Text>
            </View>
            <Text
              style={[
                styles.stepStatusPending,
                isVerified && styles.stepStatusDone,
              ]}
            >
              {isVerified ? verifiedTime : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Live Hospital Scan Action Button */}
        {!isVerified ? (
          <TouchableOpacity
            style={[styles.scanSimBtn, isVerifying && { opacity: 0.7 }]}
            onPress={handleSimulateHospitalScan}
            disabled={isVerifying}
            activeOpacity={0.8}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
                <Text style={styles.scanSimText}>Simulate Hospital Scan & Verify</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.verifiedBanner}
            onPress={() =>
              navigation.navigate('ActiveRequestCompleted', {
                requestData: {
                  ...requestData,
                  status: 'VERIFIED',
                },
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.verifiedBannerText}>
              Verified by Hospital ({verifierId}) • View Summary →
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.returnDashboardBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
          <Text style={styles.returnDashboardText}>Save & Return to Dashboard</Text>
        </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  hospitalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  verifierText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  verifierBold: {
    fontWeight: '800',
    color: colors.text,
  },
  qrContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    marginBottom: 32,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  timelineCard: {
    width: '100%',
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
  stepStatusPending: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepStatusDone: {
    fontSize: 11.5,
    color: '#16A34A',
    fontWeight: '700',
  },
  scanSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  scanSimText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    width: '100%',
    marginTop: 4,
  },
  verifiedBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  returnDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  returnDashboardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default ActiveRequestQRVerifyScreen;
