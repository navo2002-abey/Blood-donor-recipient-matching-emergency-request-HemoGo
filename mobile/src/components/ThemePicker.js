import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const ThemePicker = () => {
  const { mode, setMode, colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isDark = mode === 'dark';

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={20} color={colors.text} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{t('settings.theme')}</Text>
        <Text style={styles.hint}>{isDark ? t('settings.dark') : t('settings.light')}</Text>
      </View>
      <Switch
        value={isDark}
        onValueChange={(value) => setMode(value ? 'dark' : 'light')}
        trackColor={{ false: '#D1D5DB', true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.text,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { fontSize: 14, lineHeight: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, lineHeight: 18, color: colors.textSecondary, marginTop: 2 },
});

export default ThemePicker;
