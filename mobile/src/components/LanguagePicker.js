import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'සිංහල' },
];

const LanguagePicker = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const active = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setLanguage(option.code)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 15, lineHeight: 22, fontWeight: '800', color: colors.text },
  optionTextActive: { color: colors.white },
});

export default LanguagePicker;
