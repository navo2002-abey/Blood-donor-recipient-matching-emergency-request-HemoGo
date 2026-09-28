import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../utils/colors';

const Input = ({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
}) => {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        style={styles.input}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 18,
    fontSize: 15,
    color: colors.text,
  },
  hint: {
    marginTop: 6,
    marginLeft: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default Input;
