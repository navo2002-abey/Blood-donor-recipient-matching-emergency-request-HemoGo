import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchBloodRequests } from '../services/bloodRequestService';
import { useTheme } from '../context/ThemeContext';

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const past = new Date(dateInput);
  const diffInSec = Math.floor((now - past) / 1000);

  if (isNaN(diffInSec) || diffInSec < 60) return 'Just now';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)}d ago`;
  return `${Math.floor(diffInSec / 604800)}w ago`;
};

const PAGE_LIMIT = 10;
const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'CRITICAL', label: 'Critical' },
];

const MyRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const loadMyRequests = async (pageNum = 1, shouldAppend = false) => {
    try {
      if (pageNum === 1 && !shouldAppend) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetchBloodRequests({
        my: 'true',
        page: pageNum,
        limit: PAGE_LIMIT,
      });

      if (res?.data && Array.isArray(res.data)) {
        // Filter strictly for requests posted by this current user
        const myOnly = res.data.filter((item) => {
          if (!user) return true;
          const reqUserId = item.requestedBy?._id || item.requestedBy?.id || item.requestedBy;
          const currentUserId = user.id || user._id;

          if (reqUserId && currentUserId && String(reqUserId) === String(currentUserId)) {
            return true;
          }
          if (
            item.requestedBy?.email &&
            user.email &&
            item.requestedBy.email.toLowerCase() === user.email.toLowerCase()
          ) {
            return true;
          }
          if (
            item.patientName &&
            user.name &&
            item.patientName.toLowerCase() === user.name.toLowerCase()
          ) {
            return true;
          }
          return !item.requestedBy;
        });

        const mapped = myOnly.map((item, idx) => ({
          _id: item._id,
          patientName: item.patientName || 'Emergency Patient',
          bloodGroup: item.bloodGroup || 'O+',
          hospital: item.hospital || 'Hospital',
          distance: `${(1.8 + (((pageNum - 1) * PAGE_LIMIT + idx) * 1.3) % 5).toFixed(1)} km away`,
          rawStatus: item.status || 'OPEN',
          status: item.status || 'OPEN',
          urgency: item.urgency || 'Medium',
          timeAgo: formatTimeAgo(item.createdAt),
          units: Number(item.units) || 1,
          fulfilledUnits: Number(item.fulfilledUnits) || 0,
          requiredDateTime: item.requiredDateTime || 'ASAP',
          createdAt: item.createdAt,
          verifierId: item.verifierId,
          additionalInfo: item.additionalInfo || '',
        }));

        if (shouldAppend) {
          setRequests((prev) => {
            const existingIds = new Set(prev.map((r) => String(r._id)));
            const newItems = mapped.filter((r) => !existingIds.has(String(r._id)));
            return [...prev, ...newItems];
          });
        } else {
          setRequests(mapped);
        }

        setPage(pageNum);
        setTotalCount(res.total || mapped.length);
        setHasMore(Boolean(res.hasMore));
      } else {
        if (!shouldAppend) setRequests([]);
        setHasMore(false);
      }
    } catch (e) {
      if (!shouldAppend) setRequests([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMyRequests(1, false);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyRequests(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadMyRequests(page + 1, true);
    }
  };

  // Compute status counts for quick tab indicators
  const counts = useMemo(() => {
    const total = requests.length;
    const active = requests.filter(
      (r) =>
        r.rawStatus === 'OPEN' ||
        r.rawStatus === 'IN_PROGRESS' ||
        r.rawStatus === 'ACCEPTED' ||
        r.rawStatus === 'ARRIVED'
    ).length;
    const verified = requests.filter(
      (r) =>
        r.rawStatus === 'VERIFIED' ||
        r.rawStatus === 'FULFILLED' ||
        r.rawStatus === 'COMPLETED' ||
        r.fulfilledUnits >= r.units
    ).length;
    const critical = requests.filter(
      (r) => String(r.urgency).toLowerCase() === 'critical'
    ).length;

    return { total, active, verified, critical };
  }, [requests]);

  // Tab & Search Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'ACTIVE') {
        const isCompleted =
          item.rawStatus === 'VERIFIED' ||
          item.rawStatus === 'FULFILLED' ||
          item.rawStatus === 'COMPLETED' ||
          item.fulfilledUnits >= item.units;
        if (isCompleted) return false;
      } else if (activeTab === 'VERIFIED') {
        const isVerified =
          item.rawStatus === 'VERIFIED' ||
          item.rawStatus === 'FULFILLED' ||
          item.rawStatus === 'COMPLETED' ||
          item.fulfilledUnits >= item.units;
        if (!isVerified) return false;
      } else if (activeTab === 'CRITICAL') {
        if (String(item.urgency).toLowerCase() !== 'critical') return false;
      }

      // 2. Search query filter
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const cleanId = String(item._id || '').toLowerCase();
      return (
        item.patientName?.toLowerCase().includes(q) ||
        item.hospital?.toLowerCase().includes(q) ||
        item.bloodGroup?.toLowerCase().includes(q) ||
        item.rawStatus?.toLowerCase().includes(q) ||
        item.urgency?.toLowerCase().includes(q) ||
        cleanId.includes(q)
      );
    });
  }, [requests, activeTab, searchQuery]);

  const getUrgencyConfig = (urgency) => {
    switch (String(urgency).toLowerCase()) {
      case 'critical':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'high':
        return { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' };
      case 'medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'low':
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  const getStatusBadge = (item) => {
    const isFulfilled =
      item.rawStatus === 'VERIFIED' ||
      item.rawStatus === 'FULFILLED' ||
      item.rawStatus === 'COMPLETED' ||
      (item.fulfilledUnits >= item.units && item.units > 0);

    if (isFulfilled) {
      return {
        label: 'Verified & Completed',
        icon: 'checkmark-circle',
        bg: '#DCFCE7',
        color: '#15803D',
        border: '#BBF7D0',
      };
    }

    if (item.rawStatus === 'IN_PROGRESS' || item.rawStatus === 'ACCEPTED') {
      return {
        label: 'Donor Accepted / En Route',
        icon: 'walk-outline',
        bg: '#FEF3C7',
        color: '#B45309',
        border: '#FDE68A',
      };
    }

    return {
      label: 'Searching Compatible Donors',
      icon: 'search-outline',
      bg: '#DBEAFE',
      color: '#1D4ED8',
      border: '#BFDBFE',
    };
  };

  const renderItem = ({ item }) => {
    const urgencyStyle = getUrgencyConfig(item.urgency);
    const statusConfig = getStatusBadge(item);
    const isCompleted =
      item.rawStatus === 'VERIFIED' ||
      item.rawStatus === 'FULFILLED' ||
      item.rawStatus === 'COMPLETED' ||
      item.fulfilledUnits >= item.units;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('TrackingRequest', {
            requestData: item,
            requestId: item._id,
            isOwner: true,
            fromMyRequests: true,
          })
        }
        activeOpacity={0.85}
      >
        {/* Card Header: Patient Name, Urgency Pill, Time */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.patientInfoCol}>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientName}
            </Text>
            <Text style={styles.hospitalText} numberOfLines={1}>
              <Ionicons name="location-outline" size={12} color="#6B7280" /> {item.hospital}
            </Text>
          </View>

          <View style={styles.headerRightCol}>
            <View
              style={[
                styles.urgencyBadge,
                { backgroundColor: urgencyStyle.bg, borderColor: urgencyStyle.border },
              ]}
            >
              <Text style={[styles.urgencyText, { color: urgencyStyle.text }]}>
                {item.urgency}
              </Text>
            </View>
            <Text style={styles.timeAgoText}>{item.timeAgo}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Card Body: Blood Group Badge + Units Details */}
        <View style={styles.cardBodyRow}>
          {/* Blood Group Circle */}
          <View style={styles.bloodBadgeWrap}>
            <Text style={styles.bloodBadgeLabel}>{item.bloodGroup}</Text>
          </View>

          {/* Core Info */}
          <View style={styles.infoCol}>
            <View style={styles.infoLine}>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'water'}
                size={14}
                color={isCompleted ? '#16A34A' : colors.primary}
              />
              <Text style={styles.unitsText}>
                {isCompleted
                  ? `${item.units} Unit${item.units > 1 ? 's' : ''} Fulfilled`
                  : `${item.units} Unit${item.units > 1 ? 's' : ''} Required`}
              </Text>
            </View>

            <View style={styles.infoLine}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.requiredTimeText}>{item.requiredDateTime}</Text>
            </View>
          </View>

          {/* Action Arrow */}
          <View style={styles.viewActionCol}>
            <View style={styles.actionPill}>
              <Text style={styles.actionPillText}>Track</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Card Footer: Live Status Pill & Request ID */}
        <View style={styles.cardFooterRow}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
            ]}
          >
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          <Text style={styles.requestIdText}>ID: #{String(item._id).slice(-8)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.paginationFooter}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.paginationFooterText}>Loading more requests...</Text>
        </View>
      );
    }

    if (!hasMore && requests.length > 0) {
      return (
        <View style={styles.paginationFooter}>
          <Text style={styles.paginationFooterEndText}>
            Showing {filteredRequests.length} of {requests.length} total requests
          </Text>
        </View>
      );
    }

    return <View style={{ height: 20 }} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('pages.myRequests')}</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('CreateBloodRequest')}
          style={styles.addBtn}
          accessibilityLabel="Create Request"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          let count = counts.total;
          if (tab.key === 'ACTIVE') count = counts.active;
          if (tab.key === 'VERIFIED') count = counts.verified;
          if (tab.key === 'CRITICAL') count = counts.critical;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, hospital, blood group, ID..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Requests List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={34} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || activeTab !== 'ALL'
                  ? 'No Matching Requests'
                  : 'No Requests Posted Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || activeTab !== 'ALL'
                  ? 'Try changing your search terms or filter tab.'
                  : "You haven't posted any emergency blood requests under your account."}
              </Text>
              {searchQuery || activeTab !== 'ALL' ? (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterText}>Clear Filters</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('CreateBloodRequest')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createBtnText}>+ Create Blood Request</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    addBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 7,
      paddingHorizontal: 6,
      borderRadius: 20,
      backgroundColor: '#F1F5F9',
      gap: 5,
    },
    tabBtnActive: {
      backgroundColor: colors.primary,
    },
    tabBtnText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: '#475569',
    },
    tabBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    tabBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
      backgroundColor: '#E2E8F0',
    },
    tabBadgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.28)',
    },
    tabBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#475569',
    },
    tabBadgeTextActive: {
      color: '#FFFFFF',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 14,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 10,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: '#FFFFFF',
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: '#1E293B',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 24,
      flexGrow: 1,
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      padding: 15,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    patientInfoCol: {
      flex: 1,
      marginRight: 10,
    },
    patientName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#0F172A',
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    hospitalText: {
      fontSize: 12.5,
      fontWeight: '500',
      color: '#64748B',
    },
    headerRightCol: {
      alignItems: 'flex-end',
      gap: 4,
    },
    urgencyBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    urgencyText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    timeAgoText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#94A3B8',
    },
    cardDivider: {
      height: 1,
      backgroundColor: '#F1F5F9',
      marginVertical: 12,
    },
    cardBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bloodBadgeWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FEE2E2',
      borderWidth: 1.5,
      borderColor: '#FECACA',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    bloodBadgeLabel: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.primary,
    },
    infoCol: {
      flex: 1,
      gap: 4,
    },
    infoLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    unitsText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
    },
    requiredTimeText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#64748B',
    },
    viewActionCol: {
      paddingLeft: 8,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FEF2F2',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FEE2E2',
    },
    actionPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    cardFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#F8FAFC',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 8,
      borderWidth: 1,
    },
    statusPillText: {
      fontSize: 11.5,
      fontWeight: '700',
    },
    requestIdText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#94A3B8',
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '500',
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 56,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1E293B',
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 13,
      color: '#64748B',
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 18,
    },
    createBtn: {
      height: 42,
      paddingHorizontal: 22,
      backgroundColor: colors.primary,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13.5,
    },
    resetFilterBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      backgroundColor: '#F1F5F9',
      borderRadius: 16,
    },
    resetFilterText: {
      color: '#475569',
      fontWeight: '600',
      fontSize: 13,
    },
    paginationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    paginationFooterText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#64748B',
    },
    paginationFooterEndText: {
      fontSize: 11.5,
      fontWeight: '500',
      color: '#94A3B8',
      textAlign: 'center',
      paddingVertical: 6,
    },
  });

export default MyRequestsScreen;
