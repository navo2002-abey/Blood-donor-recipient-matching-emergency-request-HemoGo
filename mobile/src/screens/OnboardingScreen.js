import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import DonationIllustration from '../components/DonationIllustration';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';

const FEATURES = [
  { icon: 'navigate-outline', text: 'Find nearby donors.' },
  { icon: 'calendar-outline', text: 'Schedule donations.' },
  { icon: 'notifications-outline', text: 'Stay notified.' },
  { icon: 'heart-outline', text: 'Save lives.' },
];

const OnboardingScreen = ({ navigation }) => {
  const { user } = useAuth();

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
          Donate Blood,{'\n'}
          <Text style={styles.titleAccent}>Save Lives</Text>
        </Text>
        <Text style={styles.subtitle}>Join our community to make a real difference</Text>

        <DonationIllustration />

        <View style={styles.features}>
          {FEATURES.map((item) => (
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
        <Button title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});

export default OnboardingScreen;
