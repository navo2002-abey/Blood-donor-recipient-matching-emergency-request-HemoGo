import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../../components/Logo';
import { useAlerts } from '../../context/AlertsContext';
import { colors } from '../../utils/colors';

// mode: 'sent' (requester) | 'approved' (approver)
const CONFIGS = {
  sent: {
    title: 'Transfer Request Sent!',
    subtitlePrefix: 'Request sent to',
    subtitleSuffix: "We'll notify you once they approve.",
    statusBg: '#FFFBEB',
    statusColor: '#F5A623',
    statusTextColor: '#B4791A',
    statusLabel: 'PENDING APPROVAL',
    checkColor: '#EE5260',
    outerBg: '#FFF1F3',
    shadowColor: '#EE5260',
  },
  approved: {
    title: 'Transfer Approved!',
    subtitlePrefix: 'You approved the transfer to',
    subtitleSuffix: 'Stock will be dispatched shortly.',
    statusBg: '#ECFDF5',
    statusColor: '#059669',
    statusTextColor: '#047857',
    statusLabel: 'APPROVED',
    checkColor: '#059669',
    outerBg: '#ECFDF5',
    shadowColor: '#059669',
  },
};

const TransferConfirmationScreen = ({ route, navigation }) => {
  const { unreadCount } = useAlerts();

  const {
    mode = 'sent',
    bloodGroup = 'O+',
    quantity = 1,
    sourceHospital = 'Colombo General Hospital Blood Bank',
    destinationHospital = 'National Hospital Colombo Blood Bank',
    urgency = 'HIGH',
  } = route?.params || {};

  const cfg = CONFIGS[mode] || CONFIGS.sent;
  const isApproved = mode === 'approved';

  const bloodName = (() => {
    const sign = bloodGroup.includes('+') ? 'Positive' : 'Negative';
    const letter = bloodGroup.replace(/[+-]/g, '');
    return `${letter} ${sign}`;
  })();

  const highlightHospital = isApproved ? destinationHospital : sourceHospital;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={10}
          style={styles.headerBtn}
          onPress={() => navigation.navigate('BloodRescue')}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity
          hitSlop={10}
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Alerts')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Graphic */}
        <View style={styles.graphicContainer}>
          <View style={[styles.floatingDot1, { backgroundColor: cfg.outerBg }]} />
          <View style={[styles.floatingDot2, { backgroundColor: cfg.statusColor }]} />
          <View style={[styles.outerCircle, { backgroundColor: cfg.outerBg }]}>
            <View
              style={[
                styles.innerCircle,
                {
                  backgroundColor: cfg.checkColor,
                  shadowColor: cfg.shadowColor,
                },
              ]}
            >
              <Ionicons name="checkmark" size={40} color={colors.white} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>{cfg.title}</Text>
        <Text style={styles.subtitle}>
          {cfg.subtitlePrefix}{' '}
          <Text style={styles.highlightText}>{highlightHospital}</Text>
          {'\n'}
          {cfg.subtitleSuffix}
        </Text>

        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: cfg.statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.statusColor }]} />
          <Text style={[styles.statusText, { color: cfg.statusTextColor }]}>
            STATUS: {cfg.statusLabel}
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>TRANSFER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <BloodDrop size={14} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>BLOOD TYPE</Text>
              <Text style={styles.rowValue}>
                {bloodName} ({bloodGroup})
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="cube" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>QUANTITY</Text>
              <Text style={styles.rowValue}>
                {quantity} Unit{quantity > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="flash-outline" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>URGENCY</Text>
              <Text style={styles.rowValue}>{urgency}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.iconBox}>
              <Ionicons name="business" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>FROM (SOURCE)</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {sourceHospital}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={16} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>TO (DESTINATION)</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {destinationHospital}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('PendingTransfers')}
        >
          <Ionicons name="list-outline" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>VIEW TRANSFER LOG</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('BloodRescue')}
        >
          <Text style={styles.secondaryBtnText}>BACK TO EXCHANGE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
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
  scroll: { paddingHorizontal: 24, paddingBottom: 140, alignItems: 'center' },

  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
    height: 140,
  },
  outerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  floatingDot1: {
    position: 'absolute',
    top: 0,
    right: -10,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  floatingDot2: {
    position: 'absolute',
    bottom: 10,
    left: -15,
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.6,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  highlightText: { color: colors.primary, fontWeight: '700' },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 30,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TransferConfirmationScreen;