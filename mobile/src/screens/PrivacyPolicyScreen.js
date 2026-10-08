import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const sections = [
    { title: t('privacy.collectTitle'), body: t('privacy.collect') },
    { title: t('privacy.useTitle'), body: t('privacy.use') },
    { title: t('privacy.shareTitle'), body: t('privacy.share') },
    { title: t('privacy.contactTitle'), body: t('privacy.contact') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('privacy.title')}</Text>
        <Text style={styles.updated}>{t('privacy.updated')}</Text>
        <Text style={styles.intro}>{t('privacy.intro')}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 22, lineHeight: 32, fontWeight: '800', color: colors.text },
  updated: { marginTop: 4, marginBottom: 12, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  intro: { fontSize: 14, lineHeight: 22, color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, lineHeight: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 13, lineHeight: 21, color: colors.textSecondary },
});

export default PrivacyPolicyScreen;
