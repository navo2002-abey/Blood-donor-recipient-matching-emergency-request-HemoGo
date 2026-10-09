import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DonorAvailabilityModal from './DonorAvailabilityModal';

const formatShortReturnDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isThisYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: '2-digit' }),
  });
};

const AvailabilityStatusChip = ({
  variant = 'header', // 'header' | 'compact' | 'full'
  style,
  onPressCustom,
  showIcon = true,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const status = user?.availabilityStatus || (user?.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE');
  const until = user?.unavailableUntil;

  // Auto-check if temp status has passed
  const isTemporarilyExpired =
    status === 'TEMPORARILY_UNAVAILABLE' && until && new Date(until) <= new Date();

  const effectiveStatus = isTemporarilyExpired ? 'AVAILABLE' : status;

  let config = {
    label: 'Available',
    shortLabel: 'Available',
    bgColor: isDark ? 'rgba(22, 163, 74, 0.18)' : '#DCFCE7',
    borderColor: isDark ? '#16A34A' : '#86EFAC',
    textColor: isDark ? '#4ADE80' : '#15803D',
    dotColor: '#16A34A',
    icon: 'checkmark-circle',
  };

  if (effectiveStatus === 'TEMPORARILY_UNAVAILABLE') {
    const formattedDate = formatShortReturnDate(until);
    config = {
      label: formattedDate ? `Paused until ${formattedDate}` : 'Temporarily Paused',
      shortLabel: formattedDate ? `Until ${formattedDate}` : 'Temp Paused',
      bgColor: isDark ? 'rgba(217, 119, 6, 0.18)' : '#FEF3C7',
      borderColor: isDark ? '#D97706' : '#FDE68A',
      textColor: isDark ? '#FBBF24' : '#B45309',
      dotColor: '#D97706',
      icon: 'time',
    };
  } else if (effectiveStatus === 'UNAVAILABLE') {
    config = {
      label: 'Unavailable',
      shortLabel: 'Unavailable',
      bgColor: isDark ? 'rgba(220, 38, 38, 0.18)' : '#FEE2E2',
      borderColor: isDark ? '#DC2626' : '#FCA5A5',
      textColor: isDark ? '#F87171' : '#B91C1C',
      dotColor: '#DC2626',
      icon: 'close-circle',
    };
  }

  const handlePress = () => {
    if (onPressCustom) {
      onPressCustom();
    } else {
      setModalOpen(true);
    }
  };

  if (variant === 'full') {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.fullWrap,
            { backgroundColor: config.bgColor, borderColor: config.borderColor },
            style,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.fullLabel, { color: config.textColor }]}>{config.label}</Text>
            <Text style={styles.tapToChange}>Tap to change availability</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={config.textColor} />
        </TouchableOpacity>

        <DonorAvailabilityModal visible={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
          variant === 'compact' && styles.compactChip,
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
        <Text
          style={[
            styles.chipText,
            { color: config.textColor },
            variant === 'compact' && styles.compactText,
          ]}
          numberOfLines={1}
        >
          {variant === 'compact' ? config.shortLabel : config.label}
        </Text>
        {showIcon ? (
          <Ionicons
            name="chevron-down"
            size={12}
            color={config.textColor}
            style={{ marginLeft: 2 }}
          />
        ) : null}
      </TouchableOpacity>

      <DonorAvailabilityModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

const makeStyles = (colors, isDark) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 14,
      borderWidth: 1,
      gap: 5,
    },
    compactChip: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
    },
    compactText: {
      fontSize: 10,
    },
    fullWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
      gap: 10,
    },
    fullLabel: {
      fontSize: 13,
      fontWeight: '700',
    },
    tapToChange: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });

export default AvailabilityStatusChip;
