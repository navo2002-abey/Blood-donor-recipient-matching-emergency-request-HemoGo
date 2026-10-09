import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import AvailabilityStatusChip from '../components/AvailabilityStatusChip';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { fetchBloodRequests, getMyVerifiedIds, getMyAcceptedIds } from '../services/bloodRequestService';
import { isRequestActiveAndNotExpired } from './BloodRequestListScreen';
import { colors } from '../utils/colors';
import { getNearbyDonors } from '../utils/nearbyDonors';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const DashboardScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { hasUnread } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [urgentRequest, setUrgentRequest] = useState(null);
  const { location } = useUserLocation();
  const donors = useMemo(() => getNearbyDonors(location), [location]);
  const name = user?.name || 'HemoGo User';
  const bloodGroup = user?.bloodGroup || 'O+';

  const loadUrgentEmergency = async () => {
    try {
      const userKey = user?.email || user?.id || user?._id;
      const [myVerified, myAccepted] = await Promise.all([
        getMyVerifiedIds(userKey),
        getMyAcceptedIds(userKey),
      ]);
      const res = await fetchBloodRequests({ activeOnly: 'true' });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        // Find truly active, unexpired requests that the donor hasn't already fulfilled/verified
        const openRequests = res.data.filter((item) => {
          const cleanId = String(item._id || '').replace(/^#/, '');
          if (Array.isArray(myAccepted) && myAccepted.includes(cleanId)) {
            // Already accepted by this user
            return false;
          }
          return isRequestActiveAndNotExpired(item, myVerified);
        });

        if (openRequests.length > 0) {
          const urgencyRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          const sorted = [...openRequests].sort((a, b) => {
            const rankA = urgencyRank[a.urgency] || 1;
            const rankB = urgencyRank[b.urgency] || 1;
            if (rankA !== rankB) return rankB - rankA;

            const userBlood = (user?.bloodGroup || '').toUpperCase();
            if (userBlood && a.bloodGroup?.toUpperCase() === userBlood && b.bloodGroup?.toUpperCase() !== userBlood) return -1;
            if (userBlood && b.bloodGroup?.toUpperCase() === userBlood && a.bloodGroup?.toUpperCase() !== userBlood) return 1;

            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });
          setUrgentRequest(sorted[0]);
        } else {
          setUrgentRequest(null);
        }
      } else {
        setUrgentRequest(null);
      }
    } catch {
      setUrgentRequest(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUrgentEmergency();
    }, [user])
  );

  const displayBloodGroup = urgentRequest?.bloodGroup || bloodGroup;
  const displayHospital = urgentRequest?.hospital || 'Colombo General Hospital';
  const displayUrgency = urgentRequest?.urgency ? `${urgentRequest.urgency} Priority` : t('home.highPriority');
  const isCritical = urgentRequest?.urgency === 'Critical';

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
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {hasUnread ? <View style={styles.bellBadge} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.welcome}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeLabel}>{t('home.welcome')}</Text>
            <Text style={styles.welcomeName}>{name}</Text>
            <AvailabilityStatusChip
              variant="compact"
              style={{ marginTop: 4, alignSelf: 'flex-start' }}
            />
          </View>
          <View style={styles.bloodBox}>
            <Text style={styles.bloodLabel}>{t('home.bloodGroup')}</Text>
            <Text style={styles.bloodValue}>{bloodGroup}</Text>
          </View>
        </View>

        {urgentRequest ? (
          <View style={styles.emergency}>
            <View style={styles.emergencyTop}>
              <View style={styles.emergencyTitleRow}>
                <View style={styles.redDot} />
                <Text style={styles.emergencyKicker}>
                  {isCritical ? 'CRITICAL NEED' : t('home.emergency')}
                </Text>
              </View>
            </View>
            <Text style={styles.emergencyTitle}>
              {`${displayBloodGroup} Blood Needed Urgently at ${displayHospital}`}
            </Text>
            <View style={styles.emergencyActions}>
              <TouchableOpacity
                style={styles.respondBtn}
                onPress={() => {
                  navigation.navigate('ActiveRequestProgress', {
                    requestData: urgentRequest,
                    requestId: urgentRequest._id,
                  });
                }}
              >
                <Text style={styles.respondText}>{t('home.respond')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.grid}>
          <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('FindDonors')}>
            <View style={styles.cardIcon}>
              <Ionicons name="search-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.findDonors')}</Text>
            <Text style={styles.cardSub}>{t('home.findDonorsSub')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallCard} onPress={() => navigation.navigate('CreateBloodRequest')}>
            <View style={styles.cardIcon}>
              <Ionicons name="water-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.requestBlood')}</Text>
            <Text style={styles.cardSub}>{t('home.requestBloodSub')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('RequestMatch')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="sparkles-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.requestMatch')}</Text>
            <Text style={styles.cardSub}>{t('home.requestMatchSub')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('ActiveRequests')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="reorder-three-outline" size={22} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.requestList')}</Text>
            <Text style={styles.cardSub}>{t('home.requestListSub')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('BookAppointment')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.book')}</Text>
            <Text style={styles.cardSub}>{t('home.bookSub')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => navigation.navigate('CheckEligibility')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
            </View>
            <Text style={styles.cardTitle}>{t('home.eligibility')}</Text>
            <Text style={styles.cardSub}>{t('home.eligibilitySub')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>{t('home.liveDonors')}</Text>
            <View style={styles.mapHeaderRight}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>{t('home.live')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Text style={styles.mapLink}>{t('home.fullMap')}</Text>
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
            <Text style={styles.mapFooterText}>{t('home.nearbyCount', { count: donors.length })}</Text>
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

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
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
    backgroundColor: colors.cardBg,
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
    lineHeight: 18,
    color: colors.textSecondary,
  },
  welcomeName: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
    marginTop: 5,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  bloodBox: {
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    maxWidth: 92,
  },
  bloodLabel: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.textMuted,
    fontWeight: '700',
  },
  bloodValue: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
  },
  emergency: {
    borderWidth: 1,
    borderColor: '#F7C4CB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    backgroundColor: colors.primarySoft,
  },
  emergencyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  redDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  emergencyKicker: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
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
    lineHeight: 16,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    lineHeight: 28,
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
    minHeight: 48,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  respondText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  detailsBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  detailsText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
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
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  mapCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  mapHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
  },
  mapLink: {
    fontSize: 12,
    lineHeight: 18,
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
    lineHeight: 14,
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
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});

export default DashboardScreen;
