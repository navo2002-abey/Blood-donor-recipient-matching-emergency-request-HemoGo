import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  assignDonorToBloodRequest,
  deleteAdminBloodRequest,
  fetchAdminBloodRequests,
  fetchAdminUsers,
  overrideBloodRequestStatus,
  updateAdminBloodRequest,
} from '../services/adminService';
import { ADMIN_MENU } from '../utils/roles';

const STATUS_FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'FULFILLED', label: 'Fulfilled' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const URGENCY_FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'ACCEPTED', 'FULFILLED', 'VERIFIED', 'CANCELLED'];

const PAGE_LIMIT = 8;

const AdminBloodRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data & Pagination
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    fulfilled: 0,
    cancelled: 0,
    critical: 0,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    patientName: '',
    hospital: '',
    bloodGroup: 'A+',
    units: '1',
    fulfilledUnits: '0',
    urgency: 'Medium',
    requiredDateTime: '',
    additionalInfo: '',
  });

  // Assign donor state
  const [donorsList, setDonorsList] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState('');

  // Status override state
  const [selectedStatus, setSelectedStatus] = useState('OPEN');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load blood requests with filters
  const loadRequests = useCallback(
    async (pageNum = 1, shouldAppend = false, showLoading = true) => {
      if (showLoading && pageNum === 1 && !shouldAppend) setLoading(true);
      if (shouldAppend) setLoadingMore(true);

      try {
        const params = {
          page: pageNum,
          limit: PAGE_LIMIT,
        };
        if (statusFilter !== 'All') params.status = statusFilter;
        if (urgencyFilter !== 'All') params.urgency = urgencyFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await fetchAdminBloodRequests(params);
        if (res?.success && Array.isArray(res.data)) {
          if (shouldAppend) {
            setRequests((prev) => {
              const existingIds = new Set(prev.map((r) => String(r._id)));
              const newItems = res.data.filter((r) => !existingIds.has(String(r._id)));
              return [...prev, ...newItems];
            });
          } else {
            setRequests(res.data);
          }
          setPage(pageNum);
          setTotalCount(res.total || res.data.length);
          setHasMore(Boolean(res.hasMore));
          if (res.metrics) {
            setMetrics(res.metrics);
          }
        } else {
          if (!shouldAppend) setRequests([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error loading admin requests:', error);
        if (!shouldAppend) setRequests([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [statusFilter, urgencyFilter, searchQuery]
  );

  // React immediately to filter changes and debounce search
  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadRequests(1, false, true);
      },
      searchQuery ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [statusFilter, urgencyFilter, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadRequests(1, false, false);
    }, [loadRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests(1, false, false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadRequests(page + 1, true, false);
    }
  };

  // Open Edit Modal
  const openEditModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setEditForm({
      patientName: reqItem.patientName || '',
      hospital: reqItem.hospital || '',
      bloodGroup: reqItem.bloodGroup || 'A+',
      units: String(reqItem.units || 1),
      fulfilledUnits: String(reqItem.fulfilledUnits || 0),
      urgency: reqItem.urgency || 'Medium',
      requiredDateTime: reqItem.requiredDateTime || '',
      additionalInfo: reqItem.additionalInfo || '',
    });
    setActionMenuOpen(false);
    setEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = async () => {
    if (!selectedRequest?._id) return;
    try {
      setSubmitting(true);
      await updateAdminBloodRequest(selectedRequest._id, {
        patientName: editForm.patientName,
        hospital: editForm.hospital,
        bloodGroup: editForm.bloodGroup,
        units: Number(editForm.units) || 1,
        fulfilledUnits: Number(editForm.fulfilledUnits) || 0,
        urgency: editForm.urgency,
        requiredDateTime: editForm.requiredDateTime,
        additionalInfo: editForm.additionalInfo,
      });
      setEditModalOpen(false);
      showToast({
        type: 'success',
        title: 'Request Updated',
        message: `Changes for ${editForm.patientName} saved successfully.`,
      });
      loadRequests(1, false, false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Assign Donor Modal
  const openAssignModal = async (reqItem) => {
    setSelectedRequest(reqItem);
    setActionMenuOpen(false);
    setAssignModalOpen(true);
    setSelectedDonorId('');
    try {
      setLoadingDonors(true);
      const allUsers = await fetchAdminUsers();
      const donors = allUsers.filter((u) => u.role === 'DONOR');
      setDonorsList(donors);
    } catch {
      setDonorsList([]);
    } finally {
      setLoadingDonors(false);
    }
  };

  // Submit Donor Assignment
  const handleAssignDonor = async () => {
    if (!selectedRequest?._id || !selectedDonorId) {
      Alert.alert('Selection Required', 'Please choose a donor to assign.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await assignDonorToBloodRequest(selectedRequest._id, selectedDonorId);
      setAssignModalOpen(false);
      showToast({
        type: 'success',
        title: 'Donor Assigned',
        message: res?.message || 'Donor assigned successfully to this request.',
      });
      loadRequests(1, false, false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to assign donor.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Status Override Modal
  const openStatusModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setSelectedStatus(reqItem.status || 'OPEN');
    setAdminNote('');
    setActionMenuOpen(false);
    setStatusModalOpen(true);
  };

  // Submit Status Override
  const handleOverrideStatus = async () => {
    if (!selectedRequest?._id) return;
    try {
      setSubmitting(true);
      const res = await overrideBloodRequestStatus(
        selectedRequest._id,
        selectedStatus,
        adminNote
      );
      setStatusModalOpen(false);
      showToast({
        type: 'info',
        title: 'Status Overridden',
        message: `Request status updated to ${selectedStatus}.`,
      });
      loadRequests(1, false, false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to override status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Request
  const handleDeleteRequest = (reqItem) => {
    setSelectedRequest(reqItem);
    setActionMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRequest = async () => {
    if (!selectedRequest?._id) return;
    try {
      setDeleting(true);
      const cleanId = String(selectedRequest._id).replace(/^#/, '');
      await deleteAdminBloodRequest(cleanId);
      setDeleteModalOpen(false);
      showToast({
        type: 'warning',
        title: 'Request Deleted',
        message: `Blood request #${selectedRequest._id?.slice(-6)} has been permanently removed.`,
      });
      loadRequests(1, false, false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return { bg: '#DC2626', text: '#FFFFFF' };
      case 'High':
        return { bg: '#EA580C', text: '#FFFFFF' };
      case 'Medium':
        return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'Low':
      default:
        return { bg: '#6B7280', text: '#FFFFFF' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'FULFILLED':
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#059669', label: 'Fulfilled' };
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'In Progress' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' };
      case 'OPEN':
      default:
        return { bg: '#FEF3C7', text: '#D97706', label: 'Open' };
    }
  };

  const renderItem = ({ item }) => {
    const urgencyBadge = getUrgencyBadge(item.urgency);
    const statusBadge = getStatusBadge(item.status);
    const totalUnits = Number(item.units) || 1;
    const fulfilled = Number(item.fulfilledUnits) || 0;
    const remaining = Math.max(0, totalUnits - fulfilled);

    return (
      <View style={styles.card}>
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
          <View style={styles.badgeColumn}>
            <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusPillText, { color: statusBadge.text }]}>
                {statusBadge.label}
              </Text>
            </View>
            <View style={[styles.urgencyPill, { backgroundColor: urgencyBadge.bg }]}>
              <Text style={[styles.urgencyPillText, { color: urgencyBadge.text }]}>
                {item.urgency || 'Medium'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Units & Timeline Details */}
        <View style={styles.cardDetailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={15} color={colors.primary} />
            <Text style={styles.detailText}>
              <Text style={styles.boldText}>{fulfilled}</Text> / {totalUnits} Units Fulfilled
              {remaining > 0 ? ` (${remaining} remaining)` : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={15} color="#6B7280" />
            <Text style={styles.detailText}>{item.requiredDateTime || 'ASAP'}</Text>
          </View>
        </View>

        {/* Assigned Donors Info */}
        {Array.isArray(item.acceptedDonors) && item.acceptedDonors.length > 0 ? (
          <View style={styles.assignedDonorsWrap}>
            <Text style={styles.assignedTitle}>Assigned Donors:</Text>
            <View style={styles.donorTagsRow}>
              {item.acceptedDonors.map((ad, idx) => (
                <View key={idx} style={styles.donorTag}>
                  <Ionicons name="person-circle-outline" size={13} color="#2563EB" />
                  <Text style={styles.donorTagText}>
                    {ad.donor?.name || 'Assigned Donor'} ({ad.status})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : item.acceptedBy ? (
          <View style={styles.assignedDonorsWrap}>
            <Text style={styles.assignedTitle}>Primary Donor:</Text>
            <View style={styles.donorTag}>
              <Ionicons name="person-circle-outline" size={13} color="#2563EB" />
              <Text style={styles.donorTagText}>{item.acceptedBy?.name || 'Matched Donor'}</Text>
            </View>
          </View>
        ) : null}

        {item.additionalInfo ? (
          <Text style={styles.additionalInfoText} numberOfLines={2}>
            {item.additionalInfo}
          </Text>
        ) : null}

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.idText}>ID: #{item._id}</Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                setSelectedRequest(item);
                setActionMenuOpen(true);
              }}
            >
              <Ionicons name="ellipsis-horizontal-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.actionBtnLabel}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
            Showing all {requests.length} of {totalCount || requests.length} requests
          </Text>
        </View>
      );
    }
    return <View style={{ height: 24 }} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.iconBtn}
          accessibilityLabel="Open Menu"
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandTitle}>HemoGo Admin</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Blood Requests Control</Text>
              <Text style={styles.screenSub}>
                Full management, donor assignment, and lifecycle control
              </Text>
            </View>

            {/* KPI Metrics Cards */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
                <Text style={styles.metricVal}>{metrics.total}</Text>
                <Text style={styles.metricLabel}>Total Requests</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: '#D97706' }]}>
                <Text style={[styles.metricVal, { color: '#D97706' }]}>{metrics.open}</Text>
                <Text style={styles.metricLabel}>Open / Awaiting</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: '#059669' }]}>
                <Text style={[styles.metricVal, { color: '#059669' }]}>{metrics.fulfilled}</Text>
                <Text style={styles.metricLabel}>Fulfilled</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: '#DC2626' }]}>
                <Text style={[styles.metricVal, { color: '#DC2626' }]}>{metrics.critical}</Text>
                <Text style={styles.metricLabel}>Critical Alert</Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient, hospital, group, or ID..."
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

            {/* Status Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setStatusFilter(f.key)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Urgency Sub-filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.urgencyScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {URGENCY_FILTERS.map((u) => {
                const active = urgencyFilter === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[styles.urgencyChip, active && styles.urgencyChipActive]}
                    onPress={() => setUrgencyFilter(u)}
                  >
                    <Text style={[styles.urgencyChipText, active && styles.urgencyChipTextActive]}>
                      {u === 'All' ? 'All Urgencies' : `${u}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyWrap}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Matching Requests</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search criteria or filter options.
              </Text>
            </View>
          )
        }
      />

      {/* Action Menu Modal */}
      <Modal visible={actionMenuOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionMenuOpen(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Manage Request #{selectedRequest?._id?.slice(-6)}
              </Text>
              <Text style={styles.sheetSub}>{selectedRequest?.patientName}</Text>
            </View>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openEditModal(selectedRequest)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.sheetOptionText}>Edit Request Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openAssignModal(selectedRequest)}
            >
              <Ionicons name="person-add-outline" size={20} color="#2563EB" />
              <Text style={styles.sheetOptionText}>Assign Verified Donor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openStatusModal(selectedRequest)}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#D97706" />
              <Text style={styles.sheetOptionText}>Override Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetOption, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}
              onPress={() => handleDeleteRequest(selectedRequest)}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={[styles.sheetOptionText, { color: '#DC2626', fontWeight: '700' }]}>
                Delete Request
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setActionMenuOpen(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Request Modal */}
      <Modal visible={editModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalHeading}>Edit Blood Request</Text>
              <TouchableOpacity onPress={() => setEditModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <Text style={styles.fieldLabel}>Patient Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.patientName}
                onChangeText={(v) => setEditForm((p) => ({ ...p, patientName: v }))}
              />

              <Text style={styles.fieldLabel}>Hospital</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.hospital}
                onChangeText={(v) => setEditForm((p) => ({ ...p, hospital: v }))}
              />

              <Text style={styles.fieldLabel}>Blood Group</Text>
              <View style={styles.pickerRow}>
                {BLOOD_GROUPS.map((bg) => {
                  const active = editForm.bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.miniChip, active && styles.miniChipActive]}
                      onPress={() => setEditForm((p) => ({ ...p, bloodGroup: bg }))}
                    >
                      <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Required Units</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={editForm.units}
                    onChangeText={(v) => setEditForm((p) => ({ ...p, units: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.fieldLabel}>Fulfilled Units</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={editForm.fulfilledUnits}
                    onChangeText={(v) => setEditForm((p) => ({ ...p, fulfilledUnits: v }))}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Urgency</Text>
              <View style={styles.pickerRow}>
                {['Low', 'Medium', 'High', 'Critical'].map((u) => {
                  const active = editForm.urgency === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.miniChip, active && styles.miniChipActive]}
                      onPress={() => setEditForm((p) => ({ ...p, urgency: u }))}
                    >
                      <Text style={[styles.miniChipText, active && styles.miniChipTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Required Date/Time</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.requiredDateTime}
                onChangeText={(v) => setEditForm((p) => ({ ...p, requiredDateTime: v }))}
                placeholder="e.g. Within 6 Hours"
              />

              <Text style={styles.fieldLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 64, textAlignVertical: 'top' }]}
                multiline
                value={editForm.additionalInfo}
                onChangeText={(v) => setEditForm((p) => ({ ...p, additionalInfo: v }))}
              />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveEdit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Donor Modal */}
      <Modal visible={assignModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalHeading}>Assign Donor</Text>
              <TouchableOpacity onPress={() => setAssignModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubheading}>
              Select a registered donor to assign to #{selectedRequest?._id?.slice(-6)} ({selectedRequest?.bloodGroup}):
            </Text>

            {loadingDonors ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading donors list...</Text>
              </View>
            ) : donorsList.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted }}>No registered donors found.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 280, marginVertical: 10 }}>
                {donorsList.map((donor) => {
                  const selected = selectedDonorId === donor.id || selectedDonorId === donor._id;
                  const dId = donor.id || donor._id;
                  return (
                    <TouchableOpacity
                      key={dId}
                      style={[styles.donorOptionItem, selected && styles.donorOptionItemSelected]}
                      onPress={() => setSelectedDonorId(dId)}
                    >
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selected ? colors.primary : '#9CA3AF'}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.donorOptionName}>{donor.name}</Text>
                        <Text style={styles.donorOptionMeta}>
                          {donor.email} • {donor.phone || 'No Phone'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAssignModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAssignDonor}
                disabled={submitting || !selectedDonorId}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Assign Donor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Override Status Modal */}
      <Modal visible={statusModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.formModalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalHeading}>Override Status</Text>
              <TouchableOpacity onPress={() => setStatusModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubheading}>
              Force update the status for #{selectedRequest?._id?.slice(-6)}:
            </Text>

            <View style={styles.statusOptionsGrid}>
              {STATUS_OPTIONS.map((st) => {
                const active = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionPill, active && styles.statusOptionPillActive]}
                    onPress={() => setSelectedStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, active && styles.statusOptionTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Admin Override Note (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="e.g. Manually verified via phone confirmation"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setStatusModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleOverrideStatus}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Update Status</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdropCenter}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={32} color="#DC2626" />
            </View>
            <Text style={styles.deleteModalHeading}>Delete Blood Request?</Text>
            <Text style={styles.deleteModalSubheading}>
              Are you sure you want to permanently delete request{' '}
              <Text style={{ fontWeight: '800', color: colors.text }}>
                #{selectedRequest?._id?.slice(-6) || selectedRequest?._id}
              </Text>{' '}
              for <Text style={{ fontWeight: '800', color: colors.text }}>{selectedRequest?.patientName}</Text>?
              {'\n\n'}This action cannot be reversed.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                onPress={confirmDeleteRequest}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Sidebar Navigation */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(f) => Alert.alert('Coming Soon', `${f} is coming soon.`)}
        menu={ADMIN_MENU}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
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
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    brandTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.3,
    },
    titleSection: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      backgroundColor: colors.cardBg,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    screenSub: {
      fontSize: 12.5,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
      backgroundColor: colors.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 10,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.page,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricVal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 12,
      height: 42,
      marginHorizontal: 14,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 13,
      color: colors.text,
    },
    filterScroll: {
      paddingHorizontal: 14,
      marginBottom: 6,
    },
    urgencyScroll: {
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    filterScrollContent: {
      gap: 8,
      paddingRight: 20,
      alignItems: 'center',
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    urgencyChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    urgencyChipActive: {
      backgroundColor: colors.primarySoft || '#FEE2E2',
      borderColor: colors.primary,
    },
    urgencyChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    urgencyChipTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: 24,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginHorizontal: 14,
      marginBottom: 12,
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
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    bloodCircleText: {
      fontSize: 15,
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
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badgeColumn: {
      alignItems: 'flex-end',
      gap: 4,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    statusPillText: {
      fontSize: 10.5,
      fontWeight: '700',
    },
    urgencyPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    urgencyPillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    cardDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    detailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    boldText: {
      fontWeight: '700',
      color: colors.text,
    },
    assignedDonorsWrap: {
      backgroundColor: colors.page,
      borderRadius: 10,
      padding: 8,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    assignedTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    donorTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    donorTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EFF6FF',
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      gap: 4,
    },
    donorTagText: {
      fontSize: 11,
      color: '#1D4ED8',
      fontWeight: '600',
    },
    additionalInfoText: {
      fontSize: 11.5,
      fontStyle: 'italic',
      color: colors.textMuted,
      marginBottom: 6,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    idText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionIconBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 4,
    },
    actionBtnLabel: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primary,
    },
    paginationFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    paginationFooterText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    paginationFooterEndText: {
      fontSize: 11.5,
      color: colors.textMuted,
      textAlign: 'center',
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10,
    },
    emptySub: {
      fontSize: 12.5,
      color: colors.textMuted,
      marginTop: 4,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalBackdropCenter: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    deleteModalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    deleteIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    deleteModalHeading: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    deleteModalSubheading: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 8,
    },
    actionSheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    },
    sheetHeader: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 10,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    sheetSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sheetOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 12,
    },
    sheetOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    sheetCancelBtn: {
      marginTop: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    sheetCancelText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    formModalCard: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '90%',
    },
    modalTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    modalHeading: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    modalSubheading: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    formScroll: {
      maxHeight: 380,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: 10,
      marginBottom: 4,
    },
    formInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 12,
      height: 42,
      fontSize: 13,
      color: colors.text,
    },
    pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    miniChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.page,
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    miniChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    miniChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    twoColRow: {
      flexDirection: 'row',
      marginTop: 4,
    },
    modalActionsRow: {
      flexDirection: 'row',
      width: '100%',
      alignSelf: 'stretch',
      gap: 12,
      marginTop: 20,
    },
    modalCancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    modalCancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    modalSubmitBtn: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    modalSubmitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    donorOptionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      backgroundColor: colors.page,
    },
    donorOptionItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    donorOptionName: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.text,
    },
    donorOptionMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    statusOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: 8,
    },
    statusOptionPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.page,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusOptionPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    statusOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusOptionTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default AdminBloodRequestsScreen;
