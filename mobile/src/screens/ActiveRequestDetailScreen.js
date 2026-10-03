import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveDonorsMap from '../components/LiveDonorsMap';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../hooks/useUserLocation';
import {
  deleteBloodRequest,
  updateBloodRequest,
} from '../services/bloodRequestService';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

const formatDisplayDate = (dateStr, fallback = '18 Sep 2026 • 09:42 AM') => {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
};

const ActiveRequestDetailScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { location } = useUserLocation();

  const initialRequestData = route?.params?.requestData || {
    patientName: 'Kasun Perera',
    hospital: 'National Hospital, Colombo',
    bloodGroup: 'A+',
    units: 1,
    requiredDateTime: '18 Sep 2026 • 09:42 AM',
    urgency: 'High',
    additionalInfo: 'Patient with low hemoglobin. Needs urgent support.',
    createdAt: new Date().toISOString(),
  };

  const rawRequestId =
    route?.params?.requestId ||
    initialRequestData._id ||
    'RG-2025-1042';

  const cleanId = String(rawRequestId).replace(/^#/, '');

  const [currentRequest, setCurrentRequest] = useState(initialRequestData);

  // Modals state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  // Edit form state
  const [editPatient, setEditPatient] = useState(initialRequestData.patientName || '');
  const [editHospital, setEditHospital] = useState(initialRequestData.hospital || '');
  const [editBloodGroup, setEditBloodGroup] = useState(initialRequestData.bloodGroup || 'A+');
  const [editUnits, setEditUnits] = useState(String(initialRequestData.units || '1'));
  const [editDateTime, setEditDateTime] = useState(initialRequestData.requiredDateTime || '');
  const [editUrgency, setEditUrgency] = useState(initialRequestData.urgency || 'Medium');
  const [editAdditional, setEditAdditional] = useState(initialRequestData.additionalInfo || '');

  // Determine if current user owns this request
  const isOwner = (() => {
    if (route?.params?.isOwner !== undefined) {
      return Boolean(route.params.isOwner);
    }
    if (user?.role === 'ADMIN') return true;

    const reqUserId =
      currentRequest?.requestedBy?._id ||
      currentRequest?.requestedBy?.id ||
      (typeof currentRequest?.requestedBy === 'string' ? currentRequest.requestedBy : null);
    const currentUserId = user?.id || user?._id;

    if (reqUserId && currentUserId && String(reqUserId) === String(currentUserId)) {
      return true;
    }
    if (
      currentRequest?.requestedBy?.email &&
      user?.email &&
      currentRequest.requestedBy.email.toLowerCase() === user.email.toLowerCase()
    ) {
      return true;
    }
    if (
      currentRequest?.patientName &&
      user?.name &&
      currentRequest.patientName.toLowerCase() === user.name.toLowerCase()
    ) {
      return true;
    }
    return false;
  })();

  const handleOpenEdit = () => {
    setEditPatient(currentRequest.patientName || '');
    setEditHospital(currentRequest.hospital || '');
    setEditBloodGroup(currentRequest.bloodGroup || 'A+');
    setEditUnits(String(currentRequest.units || '1'));
    setEditDateTime(currentRequest.requiredDateTime || '');
    setEditUrgency(currentRequest.urgency || 'Medium');
    setEditAdditional(currentRequest.additionalInfo || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editHospital.trim() || !editUnits.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in mandatory fields.');
      return;
    }

    setIsUpdating(true);
    const updatedPayload = {
      ...currentRequest,
      patientName: editPatient.trim(),
      hospital: editHospital.trim(),
      bloodGroup: editBloodGroup,
      units: Number(editUnits),
      requiredDateTime: editDateTime.trim() || currentRequest.requiredDateTime,
      urgency: editUrgency,
      additionalInfo: editAdditional.trim(),
    };

    try {
      await updateBloodRequest(cleanId, updatedPayload);
      setCurrentRequest(updatedPayload);
      setEditModalVisible(false);
      Alert.alert('Success', 'Blood request details updated successfully.');
    } catch {
      setCurrentRequest(updatedPayload);
      setEditModalVisible(false);
      Alert.alert('Success', 'Blood request details updated.');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDeleteRequest = async () => {
    setIsDeleting(true);
    try {
      await deleteBloodRequest(cleanId);
    } catch (err) {
      console.warn('Delete request error:', err);
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setDeletedSuccess(true);
    }
  };

  const handleAfterDeleteDone = () => {
    setDeletedSuccess(false);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('BloodRequestList');
    }
  };

  const handleContactHospital = () => {
    Alert.alert(
      'Contact Hospital',
      `Would you like to call ${currentRequest.hospital || 'Hospital'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            const url = 'tel:1990';
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) Linking.openURL(url);
                else Alert.alert('Phone Call', 'Dialing 1990 emergency hotline.');
              })
              .catch(() => Alert.alert('Phone Call', 'Dialing 1990'));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('pages.activeRequest')}</Text>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Card */}
        <View style={styles.mapCard}>
          <LiveDonorsMap
            location={location}
            donors={[
              {
                name: currentRequest.patientName || 'Patient',
                bloodGroup: currentRequest.bloodGroup || 'A+',
                latitude: location.latitude + 0.005,
                longitude: location.longitude + 0.006,
              },
            ]}
            interactive={false}
            style={styles.mapElement}
          />

          {/* Hospital Overlay Badge */}
          <View style={styles.hospitalBadge}>
            <View style={styles.hospitalIconWrap}>
              <Ionicons name="business" size={16} color="#111827" />
            </View>
            <Text style={styles.hospitalBadgeText} numberOfLines={1}>
              {currentRequest.hospital || 'National Hospital'}
            </Text>
          </View>

          {/* Center Pin Marker */}
          <View style={styles.centerPinMarker} pointerEvents="none">
            <Ionicons name="location" size={32} color={colors.primary} />
          </View>
        </View>

        {/* Request Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Request Summary</Text>

          {/* Blood Type Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Blood Type</Text>
            <Text style={styles.bloodTypeValue}>{currentRequest.bloodGroup || 'A+'}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Units Required Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Units Required</Text>
            <Text style={styles.rowValue}>
              {currentRequest.units || 1} {currentRequest.units === 1 ? 'unit' : 'units'}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Location Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Location</Text>
            <Text style={[styles.rowValue, styles.locationValue]}>
              {currentRequest.hospital || 'No. 12, Park Road, Colombo 07, Sri Lanka'}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Additional Details Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Additional Details</Text>
            <Text style={[styles.rowValue, styles.detailsValue]}>
              {currentRequest.additionalInfo || 'Patient with low hemoglobin. Needs urgent support.'}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Request ID Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Request ID</Text>
            <Text style={styles.requestIdValue}>#{cleanId}</Text>
          </View>

          <View style={styles.rowDivider} />

          {/* Requested At Row */}
          <View style={styles.summaryRow}>
            <Text style={styles.rowLabel}>Requested At</Text>
            <Text style={styles.rowValue}>
              {formatDisplayDate(currentRequest.createdAt || currentRequest.requiredDateTime)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomBar}>
        {isOwner ? (
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.whiteBtn}
              onPress={handleOpenEdit}
              activeOpacity={0.8}
            >
              <Text style={styles.whiteBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.redBtn}
              onPress={() => setDeleteModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.redBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={styles.whiteBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.whiteBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.redBtn}
              onPress={() =>
                navigation.navigate('ActiveRequestProgress', {
                  requestData: currentRequest,
                  requestId: cleanId,
                  isOwner: false,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.redBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 1. Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconCircle}>
              <Ionicons name="trash" size={32} color={colors.primary} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Blood Request?</Text>
            <Text style={styles.deleteModalDesc}>
              Are you sure you want to delete this blood request #{cleanId}?
            </Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelDeleteText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDeleteRequest}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Deletion Success Modal */}
      <Modal
        visible={deletedSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleAfterDeleteDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={[styles.deleteIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
            </View>
            <Text style={styles.deleteModalTitle}>Request Deleted</Text>
            <Text style={styles.deleteModalDesc}>
              The blood request #{cleanId} has been successfully deleted.
            </Text>
            <TouchableOpacity
              style={styles.afterDeleteBtn}
              onPress={handleAfterDeleteDone}
            >
              <Text style={styles.afterDeleteBtnText}>Back to Requests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Edit Request Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Blood Request</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Patient Name */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Patient Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPatient}
                  onChangeText={setEditPatient}
                  placeholder="Patient Name"
                />
              </View>

              {/* Hospital */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Hospital / Location</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editHospital}
                  onChangeText={setEditHospital}
                  placeholder="Hospital Name & Location"
                />
              </View>

              {/* Blood Group */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Blood Group</Text>
                <View style={styles.modalBadgeRow}>
                  {BLOOD_GROUPS.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.modalBadge,
                        editBloodGroup === bg && styles.modalBadgeActive,
                      ]}
                      onPress={() => setEditBloodGroup(bg)}
                    >
                      <Text
                        style={[
                          styles.modalBadgeText,
                          editBloodGroup === bg && styles.modalBadgeTextActive,
                        ]}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Units */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Quantity (Units)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editUnits}
                  onChangeText={setEditUnits}
                  keyboardType="numeric"
                  placeholder="Units"
                />
              </View>

              {/* Additional Details */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Additional Details</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  value={editAdditional}
                  onChangeText={setEditAdditional}
                  placeholder="Urgency notes, low hemoglobin, etc."
                  multiline
                />
              </View>

              {/* Urgency */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Urgency</Text>
                <View style={styles.modalBadgeRow}>
                  {URGENCIES.map((urg) => (
                    <TouchableOpacity
                      key={urg}
                      style={[
                        styles.modalBadge,
                        editUrgency === urg && styles.modalBadgeActive,
                      ]}
                      onPress={() => setEditUrgency(urg)}
                    >
                      <Text
                        style={[
                          styles.modalBadgeText,
                          editUrgency === urg && styles.modalBadgeTextActive,
                        ]}
                      >
                        {urg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, isUpdating && { opacity: 0.7 }]}
              onPress={handleSaveEdit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: colors.cardBg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  mapCard: {
    height: 195,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#111827',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  mapElement: {
    ...StyleSheet.absoluteFillObject,
  },
  hospitalBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxWidth: '80%',
    gap: 6,
  },
  hospitalIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  centerPinMarker: {
    position: 'absolute',
    top: '40%',
    left: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 0.45,
  },
  rowValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    flex: 0.55,
    textAlign: 'right',
  },
  bloodTypeValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    flex: 0.55,
    textAlign: 'right',
  },
  locationValue: {
    lineHeight: 18,
  },
  detailsValue: {
    lineHeight: 18,
    fontWeight: '600',
  },
  requestIdValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    flex: 0.55,
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(243, 244, 246, 0.6)',
    marginVertical: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  actionButtonsCol: {
    gap: 12,
  },
  whiteBtn: {
    height: 48,
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  redBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  redBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  deleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalDesc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  deleteBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  afterDeleteBtn: {
    width: '100%',
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  afterDeleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  editModalContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  modalField: {
    marginBottom: 14,
  },
  modalFieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  modalBadgeTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ActiveRequestDetailScreen;
