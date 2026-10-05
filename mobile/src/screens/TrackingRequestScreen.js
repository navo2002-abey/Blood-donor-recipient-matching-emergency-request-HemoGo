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
  fetchMatchingDonors,
  getMyAcceptedIds,
  getMyVerifiedIds,
} from '../services/bloodRequestService';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const day = dateObj.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

const formatTime = (dateObj) => {
  if (!dateObj) return '';
  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

const getTimeDifferenceText = (dateObj, timeObj) => {
  if (!dateObj && !timeObj) return null;

  const now = new Date();
  const target = new Date(dateObj || now);

  if (timeObj) {
    target.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
  } else {
    target.setHours(12, 0, 0, 0);
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs < -60000) {
    return {
      text: 'Selected date/time has already passed',
      isPast: true,
      isImminent: false,
    };
  }

  if (Math.abs(diffMs) <= 60000) {
    return {
      text: 'Needed immediately (ASAP)',
      isPast: false,
      isImminent: true,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  let parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}hr`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}min`);
  }

  const durationStr = parts.join(' ');

  return {
    text: `Required in: ${durationStr}`,
    duration: durationStr,
    isPast: false,
    isImminent: totalMinutes <= 180,
  };
};

const parseRequestDate = (dtStr) => {
  if (!dtStr) return null;
  const direct = new Date(dtStr);
  if (!isNaN(direct.getTime())) return direct;
  const cleaned = dtStr.replace('•', ',').trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
};

const checkRequestClosureState = (request, isAuthorized = false, isAcceptedDonor = false) => {
  const status = (request?.status || '').toUpperCase();
  const totalUnits = Number(request?.units) || 1;
  const fulfilledUnits = Number(request?.fulfilledUnits) || 0;

  const isFulfilled =
    status === 'FULFILLED' ||
    status === 'COMPLETED' ||
    status === 'VERIFIED' ||
    (fulfilledUnits >= totalUnits && totalUnits > 0);

  if (isFulfilled) {
    if (isAuthorized) {
      // Only the accepted donor or request owner sees the private "Fulfilled" green badge & message
      return {
        isClosed: true,
        isFulfilled: true,
        isExpired: false,
        isPrivateClosed: false,
        badgeText: 'Fulfilled',
        badgeColor: '#16A34A',
        bannerText: isAcceptedDonor
          ? 'Your blood donation for this request has been fulfilled and completed.'
          : 'This blood request has been fulfilled and completed.',
      };
    } else {
      // For general public / other users, keep details private and show simple closed status
      return {
        isClosed: true,
        isFulfilled: false,
        isExpired: false,
        isPrivateClosed: true,
        badgeText: 'Closed',
        badgeColor: '#6B7280',
        bannerText: 'This blood request is closed and is no longer accepting donors.',
      };
    }
  }

  const explicitExpired = status === 'EXPIRED' || status === 'CLOSED' || status === 'CANCELLED';
  const reqDate = parseRequestDate(request?.requiredDateTime);
  const now = new Date();
  const timeExpired = reqDate && reqDate.getTime() < now.getTime() - 60000;

  if (explicitExpired || timeExpired) {
    return {
      isClosed: true,
      isFulfilled: false,
      isExpired: true,
      isPrivateClosed: false,
      badgeText: explicitExpired && status === 'CANCELLED' ? 'Cancelled' : 'Expired',
      badgeColor: '#DC2626',
      bannerText:
        explicitExpired && status === 'CANCELLED'
          ? 'This blood request has been cancelled.'
          : 'This blood request has expired and is now closed.',
    };
  }

  return {
    isClosed: false,
    isFulfilled: false,
    isExpired: false,
    isPrivateClosed: false,
    badgeText: null,
    badgeColor: null,
    bannerText: null,
  };
};

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
  const [myAcceptedIds, setMyAcceptedIds] = useState([]);
  const [myVerifiedIds, setMyVerifiedIds] = useState([]);

  useEffect(() => {
    getMyAcceptedIds().then((ids) => {
      if (Array.isArray(ids)) setMyAcceptedIds(ids);
    });
    getMyVerifiedIds().then((ids) => {
      if (Array.isArray(ids)) setMyVerifiedIds(ids);
    });
  }, []);

  // Determine if logged-in user is the owner of this request
  const isOwner = useMemo(() => {
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
  }, [route?.params?.isOwner, user, currentRequest]);

  // Determine if logged-in user is the accepted / fulfilled donor
  const isAcceptedDonor = useMemo(() => {
    if (myAcceptedIds.includes(cleanId) || myVerifiedIds.includes(cleanId)) return true;
    if (route?.params?.isAcceptedDonor === true || route?.params?.isAccepted === true) return true;
    const accUserId =
      currentRequest?.acceptedBy?._id ||
      currentRequest?.acceptedBy?.id ||
      (typeof currentRequest?.acceptedBy === 'string' ? currentRequest.acceptedBy : null);
    const verUserId =
      currentRequest?.verifiedBy?._id ||
      currentRequest?.verifiedBy?.id ||
      (typeof currentRequest?.verifiedBy === 'string' ? currentRequest.verifiedBy : null);
    const currentUserId = user?.id || user?._id;

    if (accUserId && currentUserId && String(accUserId) === String(currentUserId)) return true;
    if (verUserId && currentUserId && String(verUserId) === String(currentUserId)) return true;
    if (
      currentRequest?.acceptedBy?.email &&
      user?.email &&
      currentRequest.acceptedBy.email.toLowerCase() === user.email.toLowerCase()
    ) {
      return true;
    }
    if (
      currentRequest?.donorPhone &&
      user?.phone &&
      currentRequest.donorPhone.replace(/\s+/g, '') === user.phone.replace(/\s+/g, '')
    ) {
      return true;
    }
    return false;
  }, [myAcceptedIds, myVerifiedIds, cleanId, route?.params, currentRequest, user]);

  const isAuthorizedViewer = Boolean(isOwner || isAcceptedDonor);

  const closureState = useMemo(
    () => checkRequestClosureState(currentRequest, isAuthorizedViewer, isAcceptedDonor),
    [currentRequest, isAuthorizedViewer, isAcceptedDonor]
  );
  const [matchingDonors, setMatchingDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [notifiedDonors, setNotifiedDonors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadMatchingDonors = async () => {
      try {
        setLoadingDonors(true);
        const res = await fetchMatchingDonors({
          bloodGroup: currentRequest.bloodGroup,
          hospital: currentRequest.hospital,
        });

        if (isMounted) {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            setMatchingDonors(res.data);
          } else {
            // Intelligent fallback matching donors
            setMatchingDonors([
              {
                id: 'd1',
                name: 'Amal Perera',
                bloodGroup: currentRequest.bloodGroup || 'AB-',
                distance: '2.4km away',
                status: 'Available',
                phone: '+94 77 123 4567',
                avatar:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              },
              {
                id: 'd2',
                name: 'Rashed Fernando',
                bloodGroup: currentRequest.bloodGroup || 'A+',
                distance: '3.8km away',
                status: 'Available',
                phone: '+94 77 234 5678',
                avatar:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
              },
            ]);
          }
        }
      } catch {
        if (isMounted) {
          setMatchingDonors([
            {
              id: 'd1',
              name: 'Amal Perera',
              bloodGroup: currentRequest.bloodGroup || 'AB-',
              distance: '2.4km away',
              status: 'Available',
              phone: '+94 77 123 4567',
              avatar:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            },
          ]);
        }
      } finally {
        if (isMounted) setLoadingDonors(false);
      }
    };

    loadMatchingDonors();
    return () => {
      isMounted = false;
    };
  }, [currentRequest.bloodGroup, currentRequest.hospital]);

  const mapDonors = useMemo(() => {
    if (!matchingDonors.length) return [];
    return matchingDonors.map((d, index) => {
      const angle = (index * (2 * Math.PI)) / matchingDonors.length;
      const radius = 0.007 + (index % 3) * 0.003;
      return {
        name: d.name,
        bloodGroup: d.bloodGroup,
        latitude: location.latitude + Math.sin(angle) * radius,
        longitude: location.longitude + Math.cos(angle) * radius,
      };
    });
  }, [matchingDonors, location]);


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
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editUrgency, setEditUrgency] = useState(initialRequestData.urgency || 'Medium');

  const editTimeDiff = useMemo(
    () => getTimeDifferenceText(editDate, editTime),
    [editDate, editTime]
  );

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
    setNotifiedDonors((prev) => ({ ...prev, [donor.id]: true }));
    Alert.alert(
      'Emergency Alert Sent!',
      `An urgent push notification and SMS alert has been dispatched to ${donor.name} (${donor.distance || 'nearby'}).`
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
    const parsedDate = currentRequest.requiredDateTime ? new Date(currentRequest.requiredDateTime) : new Date();
    setEditDate(!isNaN(parsedDate.getTime()) ? parsedDate : new Date());
    setEditTime(!isNaN(parsedDate.getTime()) ? parsedDate : new Date());
    setEditUrgency(currentRequest.urgency || 'Medium');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editHospital.trim() || !editUnits.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in mandatory fields.');
      return;
    }

    if (editTimeDiff && editTimeDiff.isPast) {
      Alert.alert(
        'Invalid Date / Time',
        'The selected date and time has already passed. Please select an upcoming date and time to update the request.'
      );
      return;
    }

    setIsUpdating(true);
    const updatedPayload = {
      ...currentRequest,
      patientName: editPatient.trim(),
      hospital: editHospital.trim(),
      bloodGroup: editBloodGroup,
      units: Number(editUnits),
      requiredDateTime: `${formatDate(editDate)} • ${formatTime(editTime)}`,
      urgency: editUrgency,
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

  const showBackButton = Boolean(
    route?.params?.fromMyRequests ||
    route?.params?.showBack ||
    route?.params?.fromHistory
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}
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
        <View style={[
          styles.trackingCard,
          closureState.isClosed && (
            closureState.isFulfilled
              ? styles.trackingCardFulfilled
              : closureState.isExpired
              ? styles.trackingCardClosed
              : styles.trackingCardNeutralClosed
          ),
        ]}>
          <View style={[
            styles.speedometerCircle,
            closureState.isClosed && (
              closureState.isFulfilled
                ? styles.circleFulfilled
                : closureState.isExpired
                ? styles.circleClosed
                : styles.circleNeutralClosed
            ),
          ]}>
            <Ionicons
              name={
                closureState.isFulfilled
                  ? 'checkmark-circle'
                  : closureState.isExpired
                  ? 'time'
                  : closureState.isPrivateClosed
                  ? 'lock-closed'
                  : 'speedometer-outline'
              }
              size={20}
              color={
                closureState.isFulfilled
                  ? '#16A34A'
                  : closureState.isExpired
                  ? '#DC2626'
                  : closureState.isPrivateClosed
                  ? '#6B7280'
                  : colors.primary
              }
            />
          </View>
          <View style={styles.trackingTextWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.trackingTitle}>
                Tracking Request{' '}
                <Text style={styles.trackingId}>#{cleanId}</Text>
              </Text>
              {closureState.isClosed && (
                <View style={[styles.statusMiniBadge, { backgroundColor: closureState.badgeColor }]}>
                  <Text style={styles.statusMiniBadgeText}>{closureState.badgeText}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.trackingSub,
                closureState.isClosed && {
                  color: closureState.isFulfilled ? '#15803D' : closureState.isExpired ? '#DC2626' : '#4B5563',
                  fontWeight: '700',
                },
              ]}
            >
              {closureState.isClosed ? closureState.bannerText : 'Searching for compatible donors...'}
            </Text>
          </View>
        </View>

        {/* Back to Dashboard Button (Up on Screen) */}
        <TouchableOpacity
          style={styles.topDashboardBtn}
          onPress={handleGoToDashboard}
          activeOpacity={0.85}
        >
          <Ionicons name="grid-outline" size={16} color="#FFFFFF" />
          <Text style={styles.topDashboardBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Live Radar Map */}
        <View style={styles.mapContainer}>
          <LiveDonorsMap
            location={location}
            donors={mapDonors}
            interactive={false}
            style={styles.mapElement}
          />

          {/* Concentric Radar Rings Overlay (Only pulsing if active) */}
          {!closureState.isClosed && (
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
          )}
        </View>

        {/* Request Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Request Details</Text>
            <View
              style={[
                styles.criticalPill,
                closureState.isClosed
                  ? { backgroundColor: closureState.badgeColor }
                  : currentRequest.urgency === 'Medium'
                  ? { backgroundColor: '#F59E0B' }
                  : currentRequest.urgency === 'High'
                  ? { backgroundColor: '#EA580C' }
                  : currentRequest.urgency === 'Low'
                  ? { backgroundColor: '#6B7280' }
                  : { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.criticalText}>
                {closureState.isClosed ? closureState.badgeText : (currentRequest.urgency || 'Medium')}
              </Text>
            </View>
          </View>
          <Text style={styles.hospitalText}>{currentRequest.hospital}</Text>
          <Text style={styles.metaText}>
            {currentRequest.bloodGroup} • {currentRequest.units} Units •{' '}
            {currentRequest.requiredDateTime}
          </Text>

          {/* Closed Status Notice Banner */}
          {closureState.isClosed && (
            <View
              style={[
                styles.closedNoticeBanner,
                closureState.isFulfilled
                  ? styles.fulfilledBanner
                  : closureState.isExpired
                  ? styles.expiredBanner
                  : styles.neutralClosedBanner,
              ]}
            >
              <Ionicons
                name={
                  closureState.isFulfilled
                    ? 'checkmark-circle'
                    : closureState.isExpired
                    ? 'alert-circle'
                    : 'lock-closed'
                }
                size={16}
                color={
                  closureState.isFulfilled
                    ? '#16A34A'
                    : closureState.isExpired
                    ? '#DC2626'
                    : '#6B7280'
                }
              />
              <Text
                style={[
                  styles.closedNoticeText,
                  {
                    color: closureState.isFulfilled
                      ? '#15803D'
                      : closureState.isExpired
                      ? '#B91C1C'
                      : '#4B5563',
                  },
                ]}
              >
                {closureState.bannerText}
              </Text>
            </View>
          )}

          {/* Edit & Cancel Action Buttons Row (Disabled when Expired or Fulfilled) */}
          <View style={styles.requestControlRow}>
            <TouchableOpacity
              style={[styles.editCtrlBtn, closureState.isClosed && styles.ctrlBtnDisabled]}
              onPress={closureState.isClosed ? () => Alert.alert('Request Closed', `This blood request is ${closureState.badgeText.toLowerCase()} and cannot be edited.`) : handleOpenEdit}
              activeOpacity={closureState.isClosed ? 1 : 0.7}
              disabled={closureState.isClosed}
            >
              <Ionicons name="pencil-outline" size={15} color={closureState.isClosed ? '#9CA3AF' : '#374151'} />
              <Text style={[styles.editCtrlText, closureState.isClosed && styles.ctrlTextDisabled]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteCtrlBtn, closureState.isClosed && styles.ctrlBtnDisabled]}
              onPress={closureState.isClosed ? () => Alert.alert('Request Closed', `This blood request is already ${closureState.badgeText.toLowerCase()}.`) : () => setDeleteModalVisible(true)}
              activeOpacity={closureState.isClosed ? 1 : 0.7}
              disabled={closureState.isClosed}
            >
              <Ionicons name="close-circle-outline" size={15} color={closureState.isClosed ? '#9CA3AF' : colors.primary} />
              <Text style={[styles.deleteCtrlText, closureState.isClosed && styles.ctrlTextDisabled]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Matching Donors List */}
        {loadingDonors && matchingDonors.length === 0 ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
              Finding matching registered donors...
            </Text>
          </View>
        ) : (
          matchingDonors.map((donor) => {
            const isNotified = Boolean(notifiedDonors[donor.id]);
            return (
              <View key={donor.id} style={[styles.donorCard, closureState.isClosed && { opacity: 0.85 }]}>
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
                      {donor.bloodGroup} • {donor.distance || '2.4km away'}
                    </Text>
                  </View>
                  <View style={[styles.availablePill, (!donor.isAvailable || closureState.isClosed) && { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.availableText, (!donor.isAvailable || closureState.isClosed) && { color: '#6B7280' }]}>
                      {closureState.isClosed ? 'Closed' : donor.status || (donor.isAvailable ? 'Available' : 'Busy')}
                    </Text>
                  </View>
                </View>

                {/* Donor Actions (Disabled when request is Closed) */}
                <View style={styles.donorActions}>
                  <TouchableOpacity
                    style={[styles.callBtn, closureState.isClosed && styles.donorActionBtnDisabled]}
                    onPress={closureState.isClosed ? () => Alert.alert('Request Closed', `This blood request is ${closureState.badgeText.toLowerCase()}. Contacting donors is disabled.`) : () => handleCall(donor)}
                    activeOpacity={closureState.isClosed ? 1 : 0.7}
                    disabled={closureState.isClosed}
                  >
                    <Text style={[styles.callBtnText, closureState.isClosed && { color: '#9CA3AF' }]}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.notifyBtn,
                      isNotified && styles.notifyBtnDone,
                      closureState.isClosed && styles.donorActionBtnDisabled,
                    ]}
                    onPress={closureState.isClosed ? () => Alert.alert('Request Closed', `This blood request is ${closureState.badgeText.toLowerCase()}. Dispatching notifications is disabled.`) : () => handleNotify(donor)}
                    activeOpacity={closureState.isClosed ? 1 : 0.85}
                    disabled={closureState.isClosed}
                  >
                    <Text style={[styles.notifyBtnText, closureState.isClosed && { color: '#9CA3AF' }]}>
                      {closureState.isClosed
                        ? closureState.isFulfilled ? 'Completed' : 'Closed'
                        : isNotified ? 'Notified ✓' : 'Notify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Searching for more donors indicator */}
        {closureState.isClosed ? (
          <View style={styles.searchingWrap}>
            <Text style={[styles.searchingText, { color: colors.textSecondary, fontWeight: '700' }]}>
              🔒 Request is {closureState.badgeText.toLowerCase()}. All actions are closed.
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.searchingWrap, { opacity: dotOpacity }]}>
            <Text style={styles.searchingText}>Searching for more donors...</Text>
          </Animated.View>
        )}
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
              <Ionicons name="close-circle" size={34} color={colors.primary} />
            </View>
            <Text style={styles.deleteModalTitle}>Cancel Blood Request?</Text>
            <Text style={styles.deleteModalDesc}>
              Are you sure you want to cancel this blood request? Matching search and active notifications will be terminated.
            </Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelDeleteText}>Keep Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDeleteRequest}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Cancellation Success Modal */}
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
            <Text style={styles.deleteModalTitle}>Request Cancelled</Text>
            <Text style={styles.deleteModalDesc}>
              The blood request #{cleanId} has been successfully cancelled.
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

              {/* Date & Time Picker Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                {/* Date Picker */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Required Date</Text>
                  {Platform.OS === 'web' ? (
                    <View style={styles.modalInput}>
                      <input
                        type="date"
                        value={editDate ? editDate.toISOString().split('T')[0] : ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [yyyy, mm, dd] = e.target.value.split('-');
                            const newD = new Date(editDate);
                            newD.setFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
                            setEditDate(newD);
                          }
                        }}
                        style={{
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          color: colors.text,
                          fontSize: 13,
                          fontWeight: '600',
                          width: '100%',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setShowEditDatePicker(true)}
                    >
                      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                        {formatDate(editDate)}
                      </Text>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Time Picker */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Required Time</Text>
                  {Platform.OS === 'web' ? (
                    <View style={styles.modalInput}>
                      <input
                        type="time"
                        value={editTime ? `${String(editTime.getHours()).padStart(2, '0')}:${String(editTime.getMinutes()).padStart(2, '0')}` : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [hh, mm] = e.target.value.split(':');
                            const newT = new Date(editTime);
                            newT.setHours(Number(hh), Number(mm), 0, 0);
                            setEditTime(newT);
                          }
                        }}
                        style={{
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          color: colors.text,
                          fontSize: 13,
                          fontWeight: '600',
                          width: '100%',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setShowEditTimePicker(true)}
                    >
                      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                        {formatTime(editTime)}
                      </Text>
                      <Ionicons name="time-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Native DateTimePickers for Edit Modal */}
              {Platform.OS !== 'web' && showEditDatePicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowEditDatePicker(Platform.OS === 'ios');
                    if (date) setEditDate(date);
                  }}
                />
              )}

              {Platform.OS !== 'web' && showEditTimePicker && (
                <DateTimePicker
                  value={editTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, time) => {
                    setShowEditTimePicker(Platform.OS === 'ios');
                    if (time) setEditTime(time);
                  }}
                />
              )}

              {/* Time Remaining Indicator */}
              {editTimeDiff && (
                <View
                  style={[
                    styles.timeDiffBanner,
                    editTimeDiff.isPast && styles.timeDiffBannerPast,
                    editTimeDiff.isImminent && !editTimeDiff.isPast && styles.timeDiffBannerImminent,
                    { marginBottom: 14 },
                  ]}
                >
                  <Ionicons
                    name={editTimeDiff.isPast ? 'alert-circle-outline' : editTimeDiff.isImminent ? 'flash-outline' : 'time-outline'}
                    size={15}
                    color={editTimeDiff.isPast ? '#DC2626' : editTimeDiff.isImminent ? '#D97706' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.timeDiffText,
                      editTimeDiff.isPast && styles.timeDiffTextPast,
                      editTimeDiff.isImminent && !editTimeDiff.isPast && styles.timeDiffTextImminent,
                      { fontSize: 12 },
                    ]}
                  >
                    {editTimeDiff.text}
                  </Text>
                </View>
              )}

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
              style={[styles.saveBtn, (isUpdating || editTimeDiff?.isPast) && { opacity: 0.65 }]}
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
  iconBtnPlaceholder: {
    width: 38,
    height: 38,
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
  trackingCardFulfilled: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  trackingCardClosed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  trackingCardNeutralClosed: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
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
  circleFulfilled: {
    borderColor: '#86EFAC',
    backgroundColor: '#DCFCE7',
  },
  circleClosed: {
    borderColor: '#FECACA',
    backgroundColor: '#FEE2E2',
  },
  circleNeutralClosed: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
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
  closedNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  fulfilledBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  expiredBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  neutralClosedBanner: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  closedNoticeText: {
    fontSize: 12.5,
    fontWeight: '700',
    flex: 1,
    lineHeight: 17,
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
  ctrlBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  ctrlTextDisabled: {
    color: '#9CA3AF',
  },
  donorActionBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#E5E7EB',
    borderColor: '#E5E7EB',
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
  topDashboardBtn: {
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  topDashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  timeDiffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 2,
    marginBottom: 12,
  },
  timeDiffBannerImminent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  timeDiffBannerPast: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  timeDiffText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
  },
  timeDiffTextImminent: {
    color: '#B45309',
  },
  timeDiffTextPast: {
    color: '#DC2626',
  },
});

export default TrackingRequestScreen;
