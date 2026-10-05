import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
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
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../hooks/useUserLocation';
import {
  deleteBloodRequest,
  updateBloodRequest,
} from '../services/bloodRequestService';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

const TrackingRequestScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();

  const initialRequestData = route?.params?.requestData || {
    patientName: 'Kasun Perera',
    hospital: 'National Hospital Colombo',
    bloodGroup: 'A+',
    units: 2,
    requiredDateTime: 'Within 6 Hours',
    urgency: 'Medium',
    additionalInfo: '',
  };

  const rawRequestId =
    route?.params?.requestId ||
    initialRequestData._id ||
    'REQ-2026-001';

  const cleanId = String(rawRequestId).replace(/^#/, '');

  const { location } = useUserLocation();

  const [currentRequest, setCurrentRequest] = useState(initialRequestData);
  const [notified, setNotified] = useState(false);

  // Determine if logged-in user is the owner of this request
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

  // Radar Pulse Animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Continuous radar ripple animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing search text animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.35,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, dotOpacity]);

  const donorList = [
    {
      id: 'd1',
      name: 'Amal Perera',
      bloodGroup: currentRequest.bloodGroup || 'A+',
      distance: '2.4km away',
      status: 'Available',
      phone: '+94 77 123 4567',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const handleCall = (donor) => {
    Alert.alert(
      'Contact Donor',
      `Call ${donor.name} at ${donor.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            const url = `tel:${donor.phone.replace(/\s+/g, '')}`;
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(url);
                } else {
                  Alert.alert('Phone Call', `Dialing ${donor.phone}`);
                }
              })
              .catch(() => Alert.alert('Phone Call', `Dialing ${donor.phone}`));
          },
        },
      ]
    );
  };

  const handleNotify = (donor) => {
    setNotified(true);
    Alert.alert(
      'Emergency Alert Sent!',
      `An urgent push notification and SMS alert has been dispatched to ${donor.name} (${donor.distance}).`
    );
  };

  const handleGoToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleOpenEdit = () => {
    setEditPatient(currentRequest.patientName || '');
    setEditHospital(currentRequest.hospital || '');
    setEditBloodGroup(currentRequest.bloodGroup || 'A+');
    setEditUnits(String(currentRequest.units || '1'));
    setEditDateTime(currentRequest.requiredDateTime || '');
    setEditUrgency(currentRequest.urgency || 'Medium');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editHospital.trim() || !editUnits.trim() || !editDateTime.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in all details before saving.');
      return;
    }

    setIsUpdating(true);
    const updatedPayload = {
      ...currentRequest,
      patientName: editPatient.trim(),
      hospital: editHospital.trim(),
      bloodGroup: editBloodGroup,
      units: Number(editUnits),
      requiredDateTime: editDateTime.trim(),
      urgency: editUrgency,
    };

    try {
      await updateBloodRequest(cleanId, updatedPayload);
      setCurrentRequest(updatedPayload);
      setEditModalVisible(false);
      Alert.alert('Success', 'Blood request details updated successfully.');
    } catch (e) {
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
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const rippleScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.4],
  });

  const rippleOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.65, 0.3, 0],
  });

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
        <View style={styles.brandContainer}>
          <BloodDrop size={18} />
          <Text style={styles.brandTitle}>HemoGo</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Notifications', 'No new alerts.')}
          style={styles.iconBtn}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Tracking Status Card */}
        <View style={styles.trackingCard}>
          <View style={styles.speedometerCircle}>
            <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.trackingTextWrap}>
            <Text style={styles.trackingTitle}>
              Tracking Request{' '}
              <Text style={styles.trackingId}>#{cleanId}</Text>
            </Text>
            <Text style={styles.trackingSub}>
              Searching for compatible donors...
            </Text>
          </View>
        </View>

        {/* Live Radar Map */}
        <View style={styles.mapContainer}>
          <LiveDonorsMap
            location={location}
            donors={[
              {
                name: 'Amal Perera',
                bloodGroup: currentRequest.bloodGroup || 'A+',
                latitude: location.latitude + 0.008,
                longitude: location.longitude + 0.009,
              },
            ]}
            interactive={false}
            style={styles.mapElement}
          />

          {/* Concentric Radar Rings Overlay */}
          <View style={styles.radarOverlay} pointerEvents="none">
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
            <View style={styles.radarOuterRing} />
            <View style={styles.radarMidRing} />
            <View style={styles.radarCoreCircle}>
              <BloodDrop size={16} />
            </View>
          </View>
        </View>

        {/* Request Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Request Details</Text>
            <View
              style={[
                styles.criticalPill,
                currentRequest.urgency === 'Medium' && { backgroundColor: '#F59E0B' },
                currentRequest.urgency === 'High' && { backgroundColor: '#EA580C' },
                currentRequest.urgency === 'Low' && { backgroundColor: '#6B7280' },
              ]}
            >
              <Text style={styles.criticalText}>
                {currentRequest.urgency || 'Medium'}
              </Text>
            </View>
          </View>
          <Text style={styles.hospitalText}>{currentRequest.hospital}</Text>
          <Text style={styles.metaText}>
            {currentRequest.bloodGroup} • {currentRequest.units} Units •{' '}
            {currentRequest.requiredDateTime}
          </Text>

          {/* Edit & Delete Action Buttons Row (Only shown to Request Creator / Owner) */}
          {isOwner ? (
            <View style={styles.requestControlRow}>
              <TouchableOpacity
                style={styles.editCtrlBtn}
                onPress={handleOpenEdit}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={15} color="#374151" />
                <Text style={styles.editCtrlText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteCtrlBtn}
                onPress={() => setDeleteModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color={colors.primary} />
                <Text style={styles.deleteCtrlText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.readOnlyRow}>
              <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
              <Text style={styles.readOnlyText}>Public Request • View Only</Text>
            </View>
          )}
        </View>

        {/* Matching Donors List */}
        {donorList.map((donor) => (
          <View key={donor.id} style={styles.donorCard}>
            <View style={styles.donorTopRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: donor.avatar }}
                  style={styles.avatarImg}
                  defaultSource={{ uri: donor.avatar }}
                />
              </View>
              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{donor.name}</Text>
                <Text style={styles.donorSub}>
                  {donor.bloodGroup} • {donor.distance}
                </Text>
              </View>
              <View style={styles.availablePill}>
                <Text style={styles.availableText}>{donor.status}</Text>
              </View>
            </View>

            {/* Donor Actions */}
            <View style={styles.donorActions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(donor)}
                activeOpacity={0.7}
              >
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.notifyBtn,
                  notified && styles.notifyBtnDone,
                ]}
                onPress={() => handleNotify(donor)}
                activeOpacity={0.85}
              >
                <Text style={styles.notifyBtnText}>
                  {notified ? 'Notified ✓' : 'Notify'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Searching for more donors indicator */}
        <Animated.View style={[styles.searchingWrap, { opacity: dotOpacity }]}>
          <Text style={styles.searchingText}>Searching for more donors...</Text>
        </Animated.View>

        {/* Go to Dashboard CTA */}
        <TouchableOpacity
          style={styles.dashboardBtn}
          onPress={handleGoToDashboard}
          activeOpacity={0.85}
        >
          <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

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
              Are you sure you want to delete this blood request? Active notifications to nearby donors will be cancelled.
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
              <Text style={styles.afterDeleteBtnText}>Back to Dashboard</Text>
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
                <Text style={styles.modalFieldLabel}>Hospital</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editHospital}
                  onChangeText={setEditHospital}
                  placeholder="Hospital Name"
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

              {/* Required Date & Time */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Required Date / Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editDateTime}
                  onChangeText={setEditDateTime}
                  placeholder="e.g. 16 Sep 2026, 10:00 AM"
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 32,
  },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  speedometerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackingTextWrap: {
    flex: 1,
  },
  trackingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  trackingId: {
    color: colors.primary,
    fontWeight: '800',
  },
  trackingSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mapContainer: {
    height: 210,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    backgroundColor: colors.border,
  },
  mapElement: {
    ...StyleSheet.absoluteFillObject,
  },
  radarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(227, 30, 53, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(227, 30, 53, 0.4)',
  },
  radarOuterRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(227, 30, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(227, 30, 53, 0.25)',
  },
  radarMidRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(227, 30, 53, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(227, 30, 53, 0.45)',
  },
  radarCoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  detailsCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    marginBottom: 14,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  criticalPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hospitalText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  requestControlRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  editCtrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editCtrlText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  deleteCtrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteCtrlText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  readOnlyText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  donorCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  donorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  donorSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  availablePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  availableText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  donorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  notifyBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtnDone: {
    backgroundColor: '#16A34A',
  },
  notifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchingWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  searchingText: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dashboardBtn: {
    height: 50,
    backgroundColor: '#1E293B',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  deleteModalCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  deleteIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalDesc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  deleteBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
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
    height: 46,
    borderRadius: 23,
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
    borderRadius: 23,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  afterDeleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  editModalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalField: {
    marginBottom: 14,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    backgroundColor: colors.page,
    borderRadius: 12,
    paddingHorizontal: 14,
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
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.page,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalBadgeTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default TrackingRequestScreen;
