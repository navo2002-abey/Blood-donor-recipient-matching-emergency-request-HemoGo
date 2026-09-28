import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';

const LoadingIndicator = ({ label }) => {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default LoadingIndicator;
