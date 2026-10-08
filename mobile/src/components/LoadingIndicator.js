import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const LoadingIndicator = ({ label }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
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
