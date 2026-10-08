import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useMyHospital } from '../../hooks/useMyHospital';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { useTheme } from '../../context/ThemeContext';
import { verifyQR, completeDonation } from '../../services/api';
import { verifyBloodRequest } from '../../services/bloodRequestService';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const QRScanScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const myHospital = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFocused = useIsFocused();

  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const verify = async (code) => {
    setBusy(true);

    try {
      let qrData;
      try {
        qrData = JSON.parse(code);
      } catch {
        qrData = { id: code };
      }

      console.log('=== PARSED QR DATA ===');
      console.log('qrData:', qrData);
      console.log('qrData.type:', qrData.type);

      // Check if it's a blood request QR
      if (qrData.type === 'HEMOGO_DONATION_VERIFICATION') {
        console.log('=== BLOOD REQUEST QR DETECTED ===');
        console.log('requestId:', qrData.requestId);
        console.log('verifierId:', qrData.verifierId);
        // Handle blood request verification
        const verifyResult = await verifyBloodRequest(qrData.requestId, {
          verifierId: qrData.verifierId,
        });
        
        setResult({
          valid: true,
          message: 'Blood request verified successfully',
          type: 'blood_request',
          bloodRequest: {
            requestId: qrData.requestId,
            hospital: qrData.hospital,
            bloodGroup: qrData.bloodGroup,
            units: qrData.units,
            verifierId: qrData.verifierId,
          },
          code: qrData.requestId,
        });
        setBusy(false);
        return;
      }

      // Handle donor appointment QR
      const verifyResult = await verifyQR(qrData.id);
      if (!verifyResult.success) {
        setResult({
          valid: false,
          message: verifyResult.message || 'Invalid QR code',
          donor: null,
          code: qrData.id,
        });
        setBusy(false);
        return;
      }

      const { donor, appointment, eligibility } = verifyResult.data;

      setResult({
        valid: true,
        message: 'Donor verified successfully',
        type: 'donor_appointment',
        donor: {
          name: donor.name,
          bloodGroup: donor.bloodGroup,
          age: donor.age,
          weight: donor.weight,
          lastDonation: donor.lastDonationDate || 'N/A',
          eligible: eligibility.eligible,
        },
        appointment,
        eligibility,
        code: qrData.id,
      });
    } catch (error) {
      console.error('Verify error:', error);
      setResult({
        valid: false,
        message: error.response?.data?.message || 'Failed to verify code',
        donor: null,
        code: code,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scannedRef.current || busy) return;
    scannedRef.current = true;
    console.log('=== QR SCANNED ===');
    console.log('Raw data:', data);
    await verify(data);
  };

  const reset = () => {
    setResult(null);
    scannedRef.current = false;
  };

  const handleCompleteDonation = async () => {
    if (!result || !result.code) return;
    if (!result.donor?.eligible) {
      return Alert.alert('Not Eligible', 'This donor is not eligible for donation.');
    }
    if (result.appointment?.completed) {
      return Alert.alert('Already Completed', 'This donation has already been logged.');
    }

    setBusy(true);
    try {
      await completeDonation(result.code);
      Alert.alert('Success', 'Donation logged successfully.');
      setResult({
        ...result,
        appointment: { ...result.appointment, completed: true },
      });
    } catch (error) {
      console.error('Complete donation error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to log donation.');
    } finally {
      setBusy(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader navigation={navigation} onMenuPress={() => setSidebarOpen(true)} />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.primary} />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- RESULT VIEW ----------
  if (result) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          navigation={navigation}
          onMenuPress={() => setSidebarOpen(true)}
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.resultBanner,
              result.valid ? styles.resultBannerSuccess : styles.resultBannerFail,
            ]}
          >
            {result.valid ? (
              <View style={styles.resultIconBox}>
                <Ionicons name="checkmark" size={38} color={colors.white} />
              </View>
            ) : (
              <View style={[styles.resultIconBox, styles.resultIconBoxFail]}>
                <Ionicons name="close" size={38} color={colors.white} />
              </View>
            )}
            <Text
              style={[
                styles.resultTitle,
                result.valid ? styles.resultTitleSuccess : styles.resultTitleFail,
              ]}
            >
              {result.valid ? 'Verified' : 'Verification Failed'}
            </Text>
            <Text style={styles.resultSub}>
              {result.valid && result.type === 'blood_request'
                ? result.message
                : result.valid
                ? 'Donor identity confirmed successfully.'
                : result.message}
            </Text>
          </View>

          {result.valid && result.type === 'blood_request' && result.bloodRequest ? (
            <View style={styles.donorCard}>
              <View style={styles.donorTop}>
                <View style={styles.donorAvatar}>
                  <Ionicons name="water-outline" size={24} color={colors.white} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.donorName}>Blood Request</Text>
                  <Text style={styles.donorMeta}>
                    {result.bloodRequest.bloodGroup} · {result.bloodRequest.units} unit(s)
                  </Text>
                </View>
                <View style={[styles.eligiblePill, styles.eligiblePillSuccess]}>
                  <Text style={[styles.eligibleText, styles.eligibleTextSuccess]}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Hospital</Text>
                <Text style={styles.infoValue}>{result.bloodRequest.hospital}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="qr-code-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Request ID</Text>
                <Text style={styles.infoValue}>{result.bloodRequest.requestId}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Verifier ID</Text>
                <Text style={styles.infoValue}>{result.bloodRequest.verifierId}</Text>
              </View>
            </View>
          ) : result.valid && result.donor ? (
            <View style={styles.donorCard}>
              <View style={styles.donorTop}>
                <View style={styles.donorAvatar}>
                  <Text style={styles.donorAvatarText}>{getInitials(result.donor.name)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.donorName}>{result.donor.name}</Text>
                  <Text style={styles.donorMeta}>
                    {result.donor.bloodGroup} · {result.donor.age} years ·{' '}
                    {result.donor.weight} kg
                  </Text>
                </View>
                <View
                  style={[
                    styles.eligiblePill,
                    result.donor.eligible ? styles.eligiblePillSuccess : styles.eligiblePillFail,
                  ]}
                >
                  <Text
                    style={[
                      styles.eligibleText,
                      result.donor.eligible ? styles.eligibleTextSuccess : styles.eligibleTextFail,
                    ]}
                  >
                    {result.donor.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                  </Text>
                </View>
              </View>

              {result.eligibility && result.eligibility.message && (
                <Text style={styles.eligibilityReason}>{result.eligibility.message}</Text>
              )}

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Last Donation</Text>
                <Text style={styles.infoValue}>{result.donor.lastDonation}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="qr-code-outline" size={15} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Code</Text>
                <Text style={styles.infoValue}>{result.code}</Text>
              </View>
            </View>
          ) : null}

          {result.valid && result.donor?.eligible && !result.appointment?.completed ? (
            <TouchableOpacity
              style={[styles.outlineBtn, busy && { opacity: 0.6 }]}
              onPress={handleCompleteDonation}
              disabled={busy}
            >
              <Text style={styles.outlineBtnText}>
                {busy ? 'Logging...' : 'Confirm & Log Donation'}
              </Text>
            </TouchableOpacity>
          ) : result.valid && result.appointment?.completed ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.completedText}>Donation Completed</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Scan Another</Text>
          </TouchableOpacity>
        </ScrollView>

        <Sidebar
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navigation={navigation}
          onComingSoon={comingSoon}
          menu={OFFICER_MENU}
          variant="staff"
          activeKey="Scan Donor QR"
          hospital={myHospital}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      {isFocused ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.scanHint}>Point camera at QR code</Text>
          </View>
        </View>
      ) : null}

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={OFFICER_MENU}
        variant="staff"
        activeKey="Scan Donor QR"
        hospital={myHospital}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cardBg },
  scroll: { padding: 20, paddingBottom: 40 },

  primaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  outlineBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  outlineBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },

  /* Camera */
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  /* Result view */
  resultBanner: {
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1.5,
  },
  resultBannerSuccess: {
    backgroundColor: '#E6F7F1',
    borderColor: '#7FD1B5',
  },
  resultBannerFail: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  resultIconBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#2E9E6F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultIconBoxFail: {
    backgroundColor: colors.primary,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  resultTitleSuccess: {
    color: '#1F8A5E',
  },
  resultTitleFail: {
    color: colors.primary,
  },
  resultSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  donorCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  donorTop: { flexDirection: 'row', alignItems: 'center' },
  donorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorAvatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  donorName: { fontSize: 16, fontWeight: '800', color: colors.text },
  donorMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  eligiblePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  eligiblePillSuccess: {
    backgroundColor: colors.success,
  },
  eligiblePillFail: {
    backgroundColor: colors.primarySoft,
  },
  eligibleText: { fontSize: 10, fontWeight: '800' },
  eligibleTextSuccess: { color: colors.white },
  eligibleTextFail: { color: colors.primary },
  eligibilityReason: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.success,
    borderRadius: 12,
    marginBottom: 10,
  },
  completedText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
});

export default QRScanScreen;