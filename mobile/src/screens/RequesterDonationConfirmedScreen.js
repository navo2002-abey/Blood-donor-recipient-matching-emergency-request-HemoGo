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
import { useTheme } from '../context/ThemeContext';
import { colors as themeColors } from '../utils/colors';

const formatTime = (dateVal, fallback = 'Just now') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fallback;
  }
};

const formatDate = (dateVal, fallback = 'Today') => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
};

const RequesterDonationConfirmedScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();

  const requestData = route?.params?.requestData || {
    patientName: 'Amal Perera',
    hospital: 'Sumudu Hospital',
    bloodGroup: 'A+',
    units: 1,
    fulfilledUnits: 1,
    status: 'VERIFIED',
    urgency: 'Critical',
    verifierId: '#NHC93241',
    verifiedAt: new Date().toISOString(),
    acceptedAt: new Date(Date.now() - 3600000).toISOString(),
    donorName: 'Amal Perera',
  };

  const patientName = requestData.patientName || 'Patient';
  const donorName =
    route?.params?.donorName ||
    requestData.donorName ||
    requestData.acceptedBy?.name ||
    'Community Donor';
  const hospitalName = requestData.hospital || 'Hospital Blood Bank';
  const bloodGroup = requestData.bloodGroup || 'O+';
  const units = Number(requestData.units) || 1;
  const verifierId = requestData.verifierId || '#NHC01078';
  const verifiedTime = formatTime(requestData.verifiedAt, '10:24 AM');
  const verifiedDate = formatDate(requestData.verifiedAt, 'Today');

  const handleReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleViewMyRequests = () => {
    navigation.navigate('MyRequests');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donation Confirmed</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Hero Badge */}
        <View style={styles.heroWrap}>
          <View style={styles.heroOuterCircle}>
            <View style={styles.heroInnerCircle}>
              <Ionicons name="checkmark" size={42} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Request Fulfilled!</Text>
          <Text style={styles.heroSubtitle}>
            A generous blood donation has been received and officially verified by the hospital
            medical staff.
          </Text>
        </View>

        {/* Verified Donation Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#15803D" />
                <Text style={styles.verifiedBadgeText}>Hospital Verified & Secured</Text>
              </View>
              <Text style={styles.badgeTimeText}>
                {verifiedDate} • {verifiedTime}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Core Info Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValueBold}>{patientName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Blood Group</Text>
              <View style={styles.bloodGroupPill}>
                <Text style={styles.bloodGroupText}>{bloodGroup}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Units Fulfilled</Text>
              <Text style={[styles.detailValueBold, { color: '#15803D' }]}>
                {units} Unit{units > 1 ? 's' : ''} (100%)
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hospital</Text>
              <Text style={styles.detailValue}>{hospitalName}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Hospital Staff Verifier Stamp */}
          <View style={styles.verifierRow}>
            <View style={styles.verifierIconWrap}>
              <Ionicons name="medkit" size={16} color={colors.primary} />
            </View>
            <View style={styles.verifierTextCol}>
              <Text style={styles.verifierTitle}>Verified by Hospital Staff</Text>
              <Text style={styles.verifierSubtitle}>
                Officer Ref: <Text style={styles.verifierBold}>{verifierId}</Text>
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
          </View>
        </View>

        {/* Donor Recognition Card */}
        <View style={styles.donorCard}>
          <View style={styles.donorHeader}>
            <View style={styles.donorAvatarWrap}>
              <Ionicons name="person" size={20} color="#DC2626" />
            </View>
            <View style={styles.donorNameCol}>
              <Text style={styles.donorLabel}>Donated By</Text>
              <Text style={styles.donorNameText}>{donorName}</Text>
            </View>
            <View style={styles.heroHeartPill}>
              <Ionicons name="heart" size={14} color="#DC2626" />
              <Text style={styles.heroHeartText}>Hero Donor</Text>
            </View>
          </View>
        </View>

        {/* Next Steps / Hospital Blood Bank Notice */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2563EB" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBoxTitle}>What happens next?</Text>
            <Text style={styles.infoBoxBody}>
              The verified blood unit has been assigned to the patient and safely transferred to the
              hospital blood bank. The clinical team will proceed with the transfusion as scheduled.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleViewMyRequests}
            activeOpacity={0.85}
          >
            <Ionicons name="list" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>View in My Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleReturnHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={17} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    topBar: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPlaceholder: {
      width: 38,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 36,
      alignItems: 'center',
    },
    heroWrap: {
      alignItems: 'center',
      marginBottom: 24,
      paddingHorizontal: 12,
    },
    heroOuterCircle: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroInnerCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#16A34A',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    heroSubtitle: {
      fontSize: 13.5,
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 20,
    },
    card: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 18,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      marginBottom: 4,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#BBF7D0',
    },
    verifiedBadgeText: {
      fontSize: 12,
      fontWeight: '750',
      color: '#15803D',
    },
    badgeTimeText: {
      fontSize: 11.5,
      fontWeight: '500',
      color: '#94A3B8',
    },
    cardDivider: {
      height: 1,
      backgroundColor: '#F1F5F9',
      marginVertical: 14,
    },
    detailsGrid: {
      gap: 12,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: '#64748B',
    },
    detailValue: {
      fontSize: 13.5,
      fontWeight: '600',
      color: '#1E293B',
      maxWidth: '60%',
      textAlign: 'right',
    },
    detailValueBold: {
      fontSize: 14,
      fontWeight: '800',
      color: '#0F172A',
    },
    bloodGroupPill: {
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    bloodGroupText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.primary,
    },
    verifierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    verifierIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifierTextCol: {
      flex: 1,
    },
    verifierTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
    },
    verifierSubtitle: {
      fontSize: 11.5,
      color: '#64748B',
    },
    verifierBold: {
      fontWeight: '700',
      color: '#0F172A',
    },
    donorCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 16,
      marginBottom: 16,
    },
    donorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    donorAvatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    donorNameCol: {
      flex: 1,
    },
    donorLabel: {
      fontSize: 11.5,
      fontWeight: '500',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    donorNameText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0F172A',
    },
    heroHeartPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF2F2',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    heroHeartText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#DC2626',
    },
    infoBox: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: '#EFF6FF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#DBEAFE',
      padding: 14,
      marginBottom: 24,
    },
    infoBoxTitle: {
      fontSize: 13,
      fontWeight: '750',
      color: '#1E40AF',
      marginBottom: 3,
    },
    infoBoxBody: {
      fontSize: 12,
      color: '#3B82F6',
      lineHeight: 17,
    },
    buttonGroup: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    secondaryBtnText: {
      color: '#475569',
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default RequesterDonationConfirmedScreen;
