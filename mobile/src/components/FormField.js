import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';

const FormField = ({ label, error, children, style }) => {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={error ? styles.errorWrap : null}>{children}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  errorWrap: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
  },
  error: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default FormField;