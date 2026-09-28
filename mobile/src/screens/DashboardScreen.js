import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const name = user?.name || 'HemoGo User';
  const bloodGroup = user?.bloodGroup || 'O+';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <TouchableOpacity onPress={() => comingSoon('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcome}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Available to Donate</Text>
            </View>
          </View>
          <View style={styles.bloodBox}>
            <Text style={styles.bloodLabel}>BLOOD GROUP</Text>
            <Text style={styles.bloodValue}>{bloodGroup}</Text>
          </View>
        </View>

        <View style={styles.emergency}>
          <View style={styles.emergencyTop}>
            <View style={styles.emergencyTitleRow}>
              <View style={styles.redDot} />
              <Text style={styles.emergencyKicker}>EMERGENCY NEED</Text>
            </View>
            <View style={styles.priority}>
              <Text style={styles.priorityText}>High Priority</Text>
            </View>
          </View>
          <Text style={styles.emergencyTitle}>
            {bloodGroup} Blood Needed Urgently at Colombo General Hospital
          </Text>
          <View style={styles.emergencyActions}>
            <TouchableOpacity style={styles.respondBtn} onPress={() => comingSoon('Respond Now')}>
              <Text style={styles.respondText}>Respond Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsBtn} onPress={() => comingSoon('Request Details')}>
              <Text style={styles.detailsText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.smallCard} onPress={() => comingSoon('Find Donors')}>
            <View style={styles.cardIcon}>
              <Ionicons name="search-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>Find Donors</Text>
            <Text style={styles.cardSub}>Locate nearby blood donors in real-time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => comingSoon('Request Blood')}>
            <View style={styles.cardIcon}>
              <BloodDrop size={18} />
            </View>
            <Text style={styles.cardTitle}>Request Blood</Text>
            <Text style={styles.cardSub}>Create urgent or regular blood requests</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.wideCard} onPress={() => comingSoon('Blood Banks')}>
          <View style={styles.cardIcon}>
            <Ionicons name="business-outline" size={20} color={colors.text} />
          </View>
          <Text style={styles.cardTitle}>Blood Banks</Text>
          <Text style={styles.cardSub}>Check local stock & inventory availability</Text>
        </TouchableOpacity>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Nearby Donors</Text>
            <View style={styles.mapHeaderRight}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Text style={styles.mapLink}>View Full Map</Text>
              </TouchableOpacity>
            </View>
          </View>
          <LiveDonorsMap
            location={location}
            donors={donors}
            style={styles.mapPreview}
          />
          <View style={styles.mapFooter}>
            <View style={styles.liveDot} />
            <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.mapFooterText}>{donors.length} Active Donors Nearby</Text>
          </View>
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        showAvailability
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  welcomeCopy: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bloodBox: {
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 78,
  },
  bloodLabel: {
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.textMuted,
    fontWeight: '700',
  },
  bloodValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emergency: {
    borderWidth: 1,
    borderColor: '#F7C4CB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#FFF8F8',
  },
  emergencyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  emergencyKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: colors.text,
  },
  priority: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  emergencyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  emergencyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  respondBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  respondText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    shadowColor: '#111111',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  wideCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#111111',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  mapCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  mapHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  mapLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
    marginRight: 8,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  mapPreview: {
    height: 180,
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mapFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default DashboardScreen;
