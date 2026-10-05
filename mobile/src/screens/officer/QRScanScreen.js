import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import Sidebar from '../../components/Sidebar';
import { useMyHospital } from '../../hooks/useMyHospital';
import { useLanguage } from '../../context/LanguageContext';
import { colors } from '../../utils/colors';
import { OFFICER_MENU } from '../../utils/roles';
import { useTheme } from '../../context/ThemeContext';

const comingSoon = (label) =>
  Alert.alert('Coming Soon', `${label} will be available soon.`);

const QRScanScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const myHospital = useMyHospital();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const verify = (code) => {
    if (!code || code.length < 4) {
      return Alert.alert('Invalid', 'Please enter a valid code (min 4 characters).');
    }
    setBusy(true);
    setTimeout(() => {
      const isValid = /^HG-/i.test(code);
      setResult({
        code,
        valid: isValid,
        donor: isValid
          ? {
              name: 'Shehani Perera',
              bloodGroup: 'O+',
              age: 24,
              weight: 58,
              lastDonation: '12 Jun 2025',
              eligible: true,
            }
          : null,
        message: isValid
          ? 'Donor identity confirmed successfully.'
          : 'Invalid or expired QR code.',
      });
      setScanning(false);
      setBusy(false);
    }, 800);
  };

  const handleManualVerify = () => verify(manualCode.trim().toUpperCase());

  const simulate = () => {
    setManualCode('HG-2026-0847');
    verify('HG-2026-0847');
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
    setManualCode('');
  };

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
            <Ionicons
              name={result.valid ? 'checkmark-circle' : 'close-circle'}
              size={54}
              color={result.valid ? colors.success : colors.primary}
            />
            <Text
              style={[
                styles.resultTitle,
                { color: result.valid ? colors.success : colors.primary },
              ]}
            >
              {result.valid ? 'Verified' : 'Verification Failed'}
            </Text>
            <Text style={styles.resultSub}>{result.message}</Text>
          </View>

          {result.valid && result.donor ? (
            <View style={styles.donorCard}>
              <View style={styles.donorTop}>
                <View style={styles.donorAvatar}>
                  <Text style={styles.donorAvatarText}>SP</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.donorName}>{result.donor.name}</Text>
                  <Text style={styles.donorMeta}>
                    {result.donor.bloodGroup} · {result.donor.age} years ·{' '}
                    {result.donor.weight} kg
                  </Text>
                </View>
                <View style={styles.eligiblePill}>
                  <Text style={styles.eligibleText}>ELIGIBLE</Text>
                </View>
              </View>

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

          <TouchableOpacity style={styles.primaryBtn} onPress={reset}>
            <Ionicons name="scan-outline" size={18} color={colors.white} />
            <Text style={styles.primaryBtnText}>Scan Another</Text>
          </TouchableOpacity>

          {result.valid ? (
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                Alert.alert('Success', 'Donor marked as eligible for donation.')
              }
            >
              <Text style={styles.outlineBtnText}>Confirm & Log Donation</Text>
            </TouchableOpacity>
          ) : null}
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

  // ---------- SCANNER VIEW ----------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        navigation={navigation}
        onMenuPress={() => setSidebarOpen(true)}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('pages.scanQr')}</Text>
          <Text style={styles.subtitle}>Point camera at the donor's QR code</Text>

          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            <Ionicons name="qr-code" size={90} color="rgba(255,255,255,0.15)" />
            <Text style={styles.viewfinderText}>
              {scanning ? 'Align QR code within frame' : 'Scanning...'}
            </Text>
            <View style={styles.scanLine} />
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoCardText}>
              Point the camera at the donor's HemoGo QR code. Verification starts
              automatically.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>MANUAL ENTRY</Text>
          <Text style={styles.sectionSub}>
            Or enter the code manually if scanning fails
          </Text>

          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={(t) => setManualCode(t.toUpperCase())}
              placeholder="e.g. HG-2026-0847"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.verifyBtn, busy && { opacity: 0.6 }]}
              onPress={handleManualVerify}
              disabled={busy}
            >
              <Ionicons
                name={busy ? 'hourglass-outline' : 'checkmark'}
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={simulate} disabled={busy}>
            <Text style={styles.primaryBtnText}>
              {busy ? 'Verifying...' : 'Simulate Successful Scan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => verify('INVALID-CODE')}
          >
            <Text style={styles.outlineBtnText}>Simulate Failed Scan</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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

  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 20 },

  viewfinder: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.primary,
  },
  cornerTopLeft: { top: 30, left: 30, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  cornerTopRight: { top: 30, right: 30, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  cornerBottomLeft: { bottom: 30, left: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  cornerBottomRight: { bottom: 30, right: 30, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  viewfinderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 30,
    right: 30,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },

  infoCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  infoCardText: { flex: 1, fontSize: 12, color: colors.text, lineHeight: 17 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionSub: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },

  manualRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  manualInput: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.page,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
    fontWeight: '700',
  },
  verifyBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  outlineBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  outlineBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },

  /* Result view */
  resultBanner: { alignItems: 'center', paddingVertical: 30, borderRadius: 22, marginBottom: 20 },
  resultBannerSuccess: { backgroundColor: '#ECFDF5' },
  resultBannerFail: { backgroundColor: colors.primarySoft },
  resultTitle: { fontSize: 22, fontWeight: '900', marginTop: 12 },
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
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
  },
  eligibleText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },
});

export default QRScanScreen;