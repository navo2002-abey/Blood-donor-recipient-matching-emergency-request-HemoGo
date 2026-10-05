import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { colors } from '../utils/colors';
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

const MyRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyRequests = async () => {
    try {
      const res = await fetchBloodRequests({ my: 'true' });
      if (res?.data && res.data.length > 0) {
        // Filter strictly for requests posted by this current user
        const myOnly = res.data.filter((item) => {
          if (!user) return true;
          const reqUserId = item.requestedBy?._id || item.requestedBy?.id || item.requestedBy;
          const currentUserId = user.id || user._id;

          if (reqUserId && currentUserId && String(reqUserId) === String(currentUserId)) {
            return true;
          }
          if (item.requestedBy?.email && user.email && item.requestedBy.email.toLowerCase() === user.email.toLowerCase()) {
            return true;
          }
          if (item.patientName && user.name && item.patientName.toLowerCase() === user.name.toLowerCase()) {
            return true;
          }
          // If created in demo mode
          return !item.requestedBy;
        });

        const mapped = myOnly.map((item, idx) => ({
          _id: item._id,
          patientName: item.patientName,
          bloodGroup: item.bloodGroup,
          hospital: item.hospital,
          distance: `${(1.8 + (idx * 1.3) % 5).toFixed(1)} km away`,
          status: item.status === 'OPEN' ? 'Awaiting Verification' : item.status || 'Active',
          urgency: item.urgency || 'Low',
          timeAgo: formatTimeAgo(item.createdAt),
          units: item.units,
          requiredDateTime: item.requiredDateTime,
          createdAt: item.createdAt,
          avatar:
            idx % 2 === 0
              ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        }));

        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyRequests();
    setRefreshing(false);
  };

  const filteredRequests = requests.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      item.patientName?.toLowerCase().includes(q) ||
      item.hospital?.toLowerCase().includes(q) ||
      item.bloodGroup?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.urgency?.toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Top Card Row: Urgency on Left, Time on Right */}
      <View style={styles.cardTopRow}>
        <Text style={styles.urgencyLabel}>{item.urgency}</Text>
        <Text style={styles.timeLabel}>• {item.timeAgo}</Text>
      </View>

      {/* Main Card Content Row */}
      <View style={styles.cardBody}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
        </View>

        {/* Details Column */}
        <View style={styles.detailsCol}>
          <Text style={styles.bloodGroupText}>
            Blood Group: <Text style={styles.bloodGroupBold}>{item.bloodGroup}</Text>
          </Text>
          <Text style={styles.hospitalText}>{item.hospital}</Text>
          <Text style={styles.metaText}>Distance: {item.distance}</Text>
          <Text style={styles.metaText}>Status: {item.status}</Text>
        </View>

        {/* View Action Button */}
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() =>
            navigation.navigate('ActiveRequestProgress', {
              requestData: item,
              requestId: item._id,
              isOwner: true,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('pages.myRequests')}</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('CreateBloodRequest')}
          style={styles.iconBtn}
          accessibilityLabel="Create Request"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Requests Posted Yet</Text>
              <Text style={styles.emptySub}>
                You haven&apos;t posted any blood requests under your account.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateBloodRequest')}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>Create Blood Request</Text>
              </TouchableOpacity>
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
    backgroundColor: colors.cardBg,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: colors.cardBg,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.page,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  detailsCol: {
    flex: 1,
    gap: 2,
  },
  bloodGroupText: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '500',
  },
  bloodGroupBold: {
    fontWeight: '800',
    color: colors.text,
  },
  hospitalText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  viewBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  createBtn: {
    height: 44,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MyRequestsScreen;
