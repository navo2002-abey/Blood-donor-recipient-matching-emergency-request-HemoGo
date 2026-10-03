import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { ADMIN_MENU } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const HelpSupportScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const faqs = t('help.faqs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);

  const openMail = async () => {
    const url = 'mailto:support@hemogo.com?subject=HemoGo%20support';
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(t('common.emailUnavailable'), t('common.emailUnavailableMessage'));
      return;
    }
    await Linking.openURL(url);
  };

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
        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={10} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('help.title')}</Text>
        <Text style={styles.subtitle}>{t('help.subtitle')}</Text>

        <View style={styles.contact}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.contactCopy}>
            <Text style={styles.contactTitle}>{t('help.support')}</Text>
            <Text style={styles.contactSub}>support@hemogo.com</Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={openMail}>
            <Text style={styles.contactBtnText}>{t('help.email')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>{t('help.questions')}</Text>
        <View style={styles.group}>
          {(Array.isArray(faqs) ? faqs : []).map((item, index) => {
            const open = openIndex === index;
            return (
              <View key={item.question}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity
                  style={styles.questionRow}
                  onPress={() => setOpenIndex(open ? -1 : index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {open ? <Text style={styles.answer}>{item.answer}</Text> : null}
              </View>
            );
          })}
        </View>

        {isAdmin ? null : (
          <>
            <Text style={styles.section}>{t('help.guides')}</Text>
            <View style={styles.group}>
              <GuideRow
                icon="calendar-outline"
                label={t('help.book')}
                onPress={() => navigation.navigate('BookAppointment')}
              />
              <View style={styles.divider} />
              <GuideRow
                icon="checkmark-circle-outline"
                label={t('help.eligibility')}
                onPress={() => navigation.navigate('CheckEligibility')}
              />
              <View style={styles.divider} />
              <GuideRow
                icon="water-outline"
                label={t('help.request')}
                onPress={() => navigation.navigate('CreateBloodRequest')}
              />
            </View>
          </>
        )}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={(feature) => Alert.alert(t('common.comingSoon'), t('common.comingSoonMessage', { feature }))}
        menu={isAdmin ? ADMIN_MENU : undefined}
        variant={isAdmin ? 'staff' : 'default'}
        activeKey={isAdmin ? 'Settings' : 'Help & Support'}
        showAvailability={!isAdmin}
        org={isAdmin ? 'HemoGo National Network' : undefined}
      />
    </SafeAreaView>
  );
};

const GuideRow = ({ icon, label, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
  <TouchableOpacity style={styles.guideRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.guideIcon}>
      <Ionicons name={icon} size={18} color={colors.text} />
    </View>
    <Text style={styles.guideLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
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
  subtitle: { marginTop: 2, marginBottom: 16, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: { flex: 1 },
  contactTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  contactSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  contactBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  section: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  group: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  question: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '800', color: colors.text },
  answer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 13,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  divider: { height: 1, backgroundColor: colors.cardBorder },
  guideRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLabel: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '800', color: colors.text },
});

export default HelpSupportScreen;
