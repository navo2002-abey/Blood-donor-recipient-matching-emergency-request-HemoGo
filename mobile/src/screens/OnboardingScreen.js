import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import DonationIllustration from '../components/DonationIllustration';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const OnboardingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const features = [
    { icon: 'navigate-outline', text: t('pages.findNearby') },
    { icon: 'calendar-outline', text: t('pages.schedule') },
    { icon: 'notifications-outline', text: t('pages.stayNotified') },
    { icon: 'heart-outline', text: t('pages.saveLivesShort') },
  ];

  const handleContinue = () => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      return;
    }
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BloodDrop size={20} />
        <Text style={styles.brand}>HemoGo</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {t('pages.donate')}{'\n'}
          <Text style={styles.titleAccent}>{t('pages.saveLives')}</Text>
        </Text>
        <Text style={styles.subtitle}>{t('pages.join')}</Text>

        <DonationIllustration />

        <View style={styles.features}>
          {features.map((item) => (
            <View key={item.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={item.icon} size={15} color={colors.primary} />
              </View>
              <Text style={styles.feature}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Button title={t('pages.continue')} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  brand: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingTop: 28,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.9,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  features: {
    marginTop: 10,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  feature: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});

export default OnboardingScreen;
