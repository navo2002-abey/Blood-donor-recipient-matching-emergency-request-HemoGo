import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LiveDonorsMap from './LiveDonorsMap';
import { BloodDrop } from './Logo';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const EmergencyAlertModal = ({
  visible,
  onClose,
  onAccept,
  data = {},
}) => {
  const { colors, isDark } = useTheme();

  const bloodGroup = data?.bloodGroup || 'O+';
  const hospital = data?.hospital || 'National Hospital';
  const patientName = data?.patientName || 'Kamal P.';
  const phone = data?.phone || '071-xxxxxxx';
  const location = data?.location || { latitude: 6.9271, longitude: 79.8612 };

  const mapDonors = [
    {
      name: hospital,
      bloodGroup: bloodGroup,
      latitude: location.latitude,
      longitude: location.longitude,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.cardBg : '#FFFFFF',
              borderColor: isDark ? colors.border : '#F1F5F9',
            },
          ]}
        >
          {/* Top Close 'X' Button */}
          <TouchableOpacity
            style={styles.topCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close Emergency Alert"
          >
            <Ionicons name="close" size={20} color={colors.textSecondary || '#64748B'} />
          </TouchableOpacity>

          {/* Header Brand */}
          <View style={styles.brandRow}>
            <BloodDrop size={15} />
            <Text style={styles.brandText}>HemoGo</Text>
          </View>

          {/* Emergency Title */}
          <Text style={styles.emergencyTitle}>EMERGENCY ALERT</Text>

          {/* Headline */}
          <Text style={[styles.headline, { color: colors.text }]}>
            A patient needs <Text style={styles.bloodGroupText}>{bloodGroup}</Text> blood at{' '}
            <Text style={styles.hospitalText}>{hospital}</Text> immediately!
          </Text>

          {/* Subtitle / Requester info */}
          <Text style={[styles.requesterText, { color: colors.textSecondary }]}>
            Requested by {patientName} ({phone})
          </Text>

          {/* Map Preview Snippet (pointerEvents none so clicks never get swallowed) */}
          <View style={styles.mapContainer} pointerEvents="none">
            <LiveDonorsMap
              location={location}
              donors={mapDonors}
              radar={false}
              interactive={false}
              style={styles.map}
            />
            {/* Hospital Pin Overlay Box */}
            <View style={styles.hospitalBadge}>
              <Ionicons name="business" size={15} color="#DC2626" />
              <Text style={styles.hospitalBadgeText} numberOfLines={1}>
                {hospital}
              </Text>
            </View>
            <View style={styles.pinDotWrapper}>
              <View style={styles.pinCircle}>
                <Ionicons name="location" size={18} color="#DC2626" />
              </View>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.declineBtn,
                {
                  backgroundColor: isDark ? colors.inputBg : '#F8FAFC',
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close-circle-outline" size={18} color="#475569" style={{ marginRight: 6 }} />
              <Text style={[styles.declineText, { color: isDark ? colors.text : '#475569' }]}>
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.acceptBtn}
              onPress={onAccept}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptText}>Accept & Go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  topCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: -0.3,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 6,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: -0.2,
    marginBottom: 4,
    paddingRight: 24,
  },
  bloodGroupText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  hospitalText: {
    fontWeight: '800',
  },
  requesterText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
  },
  mapContainer: {
    height: 125,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  hospitalBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: '80%',
  },
  hospitalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  pinDotWrapper: {
    position: 'absolute',
    top: '48%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default EmergencyAlertModal;
