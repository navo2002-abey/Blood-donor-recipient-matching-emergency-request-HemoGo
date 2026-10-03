import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import {
  fetchBloodRequests,
  getMyAcceptedIds,
  getMyVerifiedIds,
} from '../services/bloodRequestService';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const SAMPLE_REQUESTS = [
  {
    _id: 'REQ-2026-001',
    patientName: 'Kasun Perera',
    hospital: 'National Hospital Colombo',
    bloodGroup: 'A+',
    units: 2,
    requiredDateTime: '16 Sep 2026, 10:00 AM',
    urgency: 'Critical',
    status: 'OPEN',
    additionalInfo: 'Immediate assistance required for emergency surgery.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'REQ-2026-002',
    patientName: 'Nimali Silva',
    hospital: 'Lanka Hospitals Colombo',
    bloodGroup: 'O+',
    units: 1,
    requiredDateTime: 'Today, 4:00 PM',
    urgency: 'High',
    status: 'IN_PROGRESS',
    additionalInfo: 'Platelets required for ongoing treatment.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'REQ-2026-003',
    patientName: 'Sunil Jayawardena',
    hospital: 'Teaching Hospital Kandy',
    bloodGroup: 'B-',
    units: 3,
    requiredDateTime: 'Tomorrow, 9:00 AM',
    urgency: 'Medium',
    status: 'OPEN',
    additionalInfo: 'Scheduled heart surgery requirement.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: 'REQ-2026-004',
    patientName: 'Dhammika Fernando',
    hospital: 'Asiri Central Hospital',
    bloodGroup: 'AB+',
    units: 1,
    requiredDateTime: '18 Sep 2026, 11:30 AM',
    urgency: 'Low',
    status: 'OPEN',
    additionalInfo: 'Routine transfusion.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const BloodRequestListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const [requests, setRequests] = useState(SAMPLE_REQUESTS);
  const [myAcceptedIds, setMyAcceptedIds] = useState([]);
  const [myVerifiedIds, setMyVerifiedIds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [res, accIds, verIds] = await Promise.all([
        fetchBloodRequests(),
        getMyAcceptedIds(),
        getMyVerifiedIds(),
      ]);
      setMyAcceptedIds(accIds || []);
      setMyVerifiedIds(verIds || []);
      if (res?.data && res.data.length > 0) {
        setRequests(res.data);
      } else {
        setRequests(SAMPLE_REQUESTS);
      }
    } catch (e) {
      setRequests(SAMPLE_REQUESTS);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests(false);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests(false);
    setRefreshing(false);
  };

  const filteredRequests = requests.filter((item) => {
    const matchesFilter =
      activeFilter === 'All' || item.urgency?.toLowerCase() === activeFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.patientName?.toLowerCase().includes(query) ||
      item.hospital?.toLowerCase().includes(query) ||
      item.bloodGroup?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return { bg: colors.primary, text: '#FFFFFF' };
      case 'High':
        return { bg: '#EA580C', text: '#FFFFFF' };
      case 'Medium':
        return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'Low':
      default:
        return { bg: '#6B7280', text: '#FFFFFF' };
    }
  };

  const renderItem = ({ item }) => {
    const badgeStyle = getUrgencyBadge(item.urgency);

    const reqUserId =
      item?.requestedBy?._id ||
      item?.requestedBy?.id ||
      (typeof item?.requestedBy === 'string' ? item.requestedBy : null);
    const acceptedUserId =
      item?.acceptedBy?._id ||
      item?.acceptedBy?.id ||
      (typeof item?.acceptedBy === 'string' ? item.acceptedBy : null);
    const verifiedUserId =
      item?.verifiedBy?._id ||
      item?.verifiedBy?.id ||
      (typeof item?.verifiedBy === 'string' ? item.verifiedBy : null);
    const currentUserId = user?.id || user?._id;
    const cleanId = String(item._id).replace(/^#/, '');

    const isItemOwner = Boolean(
      (user?.role === 'ADMIN') ||
      (reqUserId && currentUserId && String(reqUserId) === String(currentUserId)) ||
      (item?.requestedBy?.email && user?.email && item.requestedBy.email.toLowerCase() === user.email.toLowerCase()) ||
      (item?.patientName && user?.name && item.patientName.toLowerCase() === user.name.toLowerCase())
    );

    // Personal donor ownership check
    const isMyAcceptedDonation = Boolean(
      myAcceptedIds.includes(cleanId) ||
      (acceptedUserId && currentUserId && String(acceptedUserId) === String(currentUserId)) ||
      (item?.acceptedBy?.email && user?.email && item.acceptedBy.email.toLowerCase() === user.email.toLowerCase())
    );

    const isCompleted =
      item.status === 'VERIFIED' ||
      item.status === 'FULFILLED' ||
      item.status === 'COMPLETED';

    const isInProgress =
      item.status === 'ACCEPTED' ||
      item.status === 'IN_PROGRESS';

    const isMyVerifiedDonation = Boolean(
      myVerifiedIds.includes(cleanId) ||
      (verifiedUserId && currentUserId && String(verifiedUserId) === String(currentUserId)) ||
      (isMyAcceptedDonation && isCompleted)
    );

    const handleCardPress = () => {
      if (isMyVerifiedDonation || (isCompleted && isItemOwner)) {
        // User's own completed donation -> View completion details
        navigation.navigate('ActiveRequestCompleted', {
          requestData: item,
          requestId: item._id,
          acceptedTime: item.acceptedAt
            ? new Date(item.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
          verifiedTime: item.verifiedAt
            ? new Date(item.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
          isOwner: isItemOwner,
        });
      } else if (isMyAcceptedDonation && isInProgress) {
        // User's own active accepted request -> Resume QR Code Screen
        navigation.navigate('ActiveRequestQRVerify', {
          requestData: item,
          requestId: item._id,
          verifierId: item.verifierId || '#NHC01078',
          acceptedTime: item.acceptedAt
            ? new Date(item.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwner: isItemOwner,
        });
      } else if (isCompleted || isInProgress) {
        // Someone else's donation -> View Progress / read-only overview
        navigation.navigate('ActiveRequestProgress', {
          requestData: item,
          requestId: item._id,
          isOwner: isItemOwner,
        });
      } else {
        // Open request -> Start Progress (Step 1) to accept
        navigation.navigate('ActiveRequestProgress', {
          requestData: item,
          requestId: item._id,
          isOwner: isItemOwner,
        });
      }
    };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={handleCardPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.bloodCircle}>
            <Text style={styles.bloodCircleText}>{item.bloodGroup}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {item.hospital}
            </Text>
          </View>

          {/* Personal status vs public status */}
          {isMyVerifiedDonation ? (
            <View style={[styles.urgencyPill, { backgroundColor: '#DEF7EC', flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#03543F" style={{ marginRight: 3 }} />
              <Text style={[styles.urgencyText, { color: '#03543F' }]}>Completed</Text>
            </View>
          ) : isMyAcceptedDonation && isInProgress ? (
            <View style={[styles.urgencyPill, { backgroundColor: '#FEF08A', flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="qr-code" size={11} color="#854D0E" style={{ marginRight: 3 }} />
              <Text style={[styles.urgencyText, { color: '#854D0E' }]}>In Progress</Text>
            </View>
          ) : isCompleted ? (
            <View style={[styles.urgencyPill, { backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={12} color="#4B5563" style={{ marginRight: 3 }} />
              <Text style={[styles.urgencyText, { color: '#4B5563' }]}>Fulfilled</Text>
            </View>
          ) : isInProgress ? (
            <View style={[styles.urgencyPill, { backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="people-outline" size={12} color="#1E40AF" style={{ marginRight: 3 }} />
              <Text style={[styles.urgencyText, { color: '#1E40AF' }]}>Donor Matched</Text>
            </View>
          ) : (
            <View style={[styles.urgencyPill, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.urgencyText, { color: badgeStyle.text }]}>
                {item.urgency}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {(() => {
          const totalUnits = Number(item.units) || 1;
          const fulfilledUnits =
            typeof item.fulfilledUnits === 'number'
              ? item.fulfilledUnits
              : isCompleted
              ? totalUnits
              : 0;
          const remainingUnits = Math.max(0, totalUnits - fulfilledUnits);

          let unitsLabel = `${totalUnits} Units Required`;
          let unitsColor = colors.primary;
          let unitsIcon = 'water-outline';

          if (isCompleted || remainingUnits === 0) {
            unitsLabel = `${totalUnits} Units Fulfilled`;
            unitsColor = '#059669';
            unitsIcon = 'checkmark-circle';
          } else if (fulfilledUnits > 0) {
            unitsLabel = `${remainingUnits} of ${totalUnits} Units Remaining`;
            unitsColor = '#D97706';
            unitsIcon = 'water';
          } else if (isInProgress) {
            unitsLabel = `${totalUnits} Units Required`;
            unitsColor = '#2563EB';
          }

          return (
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Ionicons name={unitsIcon} size={15} color={unitsColor} />
                <Text style={[styles.detailText, (isCompleted || fulfilledUnits > 0) && { color: unitsColor, fontWeight: '700' }]}>
                  {unitsLabel}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={15} color="#6B7280" />
                <Text style={styles.detailText}>{item.requiredDateTime}</Text>
              </View>
            </View>
          );
        })()}

        {item.additionalInfo ? (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.additionalInfo}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.idText}>ID: #{item._id}</Text>

          {isMyVerifiedDonation ? (
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: '#059669', fontWeight: '700' }]}>View Completed</Text>
              <Ionicons name="checkmark-done" size={15} color="#059669" />
            </View>
          ) : isMyAcceptedDonation && isInProgress ? (
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: '#D97706', fontWeight: '700' }]}>Show QR Code</Text>
              <Ionicons name="qr-code-outline" size={14} color="#D97706" />
            </View>
          ) : isCompleted ? (
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: colors.textSecondary, fontWeight: '500' }]}>Fulfilled by Donor</Text>
              <Ionicons name="lock-closed-outline" size={13} color="#9CA3AF" />
            </View>
          ) : isInProgress ? (
            <View style={styles.viewDetailsRow}>
              <Text style={[styles.viewDetailsText, { color: '#2563EB', fontWeight: '500' }]}>Donor Assigned</Text>
              <Ionicons name="time-outline" size={14} color="#2563EB" />
            </View>
          ) : (
            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>Track & Respond</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {/* Screen Title & Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Request List</Text>
        <Text style={styles.screenSub}>
          View and respond to live emergency blood requests
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, hospital, or blood group..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersScroll}>
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptySub}>
                There are no requests matching your current filter.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
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
  titleSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colors.cardBg,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  screenSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.page,
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: colors.text,
  },
  filtersScroll: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.page,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bloodCircleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  hospitalName: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  idText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BloodRequestListScreen;
