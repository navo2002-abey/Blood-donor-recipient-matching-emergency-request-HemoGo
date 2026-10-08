import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BloodDrop } from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { PATIENT_MENU } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';

const comingSoon = (feature) => {
  Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
};

const PatientDashboardScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerBtn}>
          <Ionicons name="menu-outline" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.brand}>
          <BloodDrop size={16} />
          <Text style={styles.brandText}>HemoGo</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{t('pages.patient')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.hello}>{t('pages.hello', { name: firstName })}</Text>
        <Text style={styles.sub}>{t('pages.patientSub')}</Text>

        <View style={styles.emergency}>
          <Text style={styles.emergencyTitle}>{t('pages.needBlood')}</Text>
          <Text style={styles.emergencyText}>{t('pages.needBloodCopy')}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('CreateBloodRequest')}
          >
            <Text style={styles.primaryText}>{t('pages.createBloodRequest')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Donors', { menu: PATIENT_MENU, showAvailability: false })}
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
            <Text style={styles.cardTitle}>{t('pages.findDonors')}</Text>
            <Text style={styles.cardSub}>{t('pages.findDonorsSub')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MyRequests')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <Text style={styles.cardTitle}>{t('pages.myRequests')}</Text>
            <Text style={styles.cardSub}>{t('pages.myRequestsSub')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        onComingSoon={comingSoon}
        menu={PATIENT_MENU}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  rolePill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { marginTop: 4, marginBottom: 18, color: colors.textSecondary, fontSize: 13 },
  emergency: {
    borderWidth: 1,
    borderColor: colors.emergencyBorder,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  emergencyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emergencyText: { marginTop: 6, marginBottom: 16, color: colors.textSecondary, fontSize: 13 },
  primaryBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: { marginTop: 10, fontWeight: '800', color: colors.text },
  cardSub: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
});

export default PatientDashboardScreen;
