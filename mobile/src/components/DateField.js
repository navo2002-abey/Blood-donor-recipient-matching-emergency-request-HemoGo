import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

/**
 * Cross-platform date field.
 * - On web: uses <input type="date">
 * - On mobile: uses TextInput with auto-format YYYY-MM-DD
 */
const DateField = ({ value, onChange, placeholder = 'YYYY-MM-DD' }) => {
  const formatWithDashes = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const handleChange = (text) => {
    onChange(formatWithDashes(text));
  };

  // ---------- WEB: use native date input ----------
  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.icon} />
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            height: 54,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            color: colors.text,
            fontFamily: 'inherit',
            paddingLeft: 8,
          }}
        />
      </View>
    );
  }

  // ---------- MOBILE: text input with auto-dashes ----------
  return (
    <View style={styles.wrap}>
      <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 16,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
});

export default DateField;