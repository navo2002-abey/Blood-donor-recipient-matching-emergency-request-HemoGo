import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import DonationIllustration from '../components/DonationIllustration';
import EmergencyMatchIllustration from '../components/EmergencyMatchIllustration';
import VerifiedRewardsIllustration from '../components/VerifiedRewardsIllustration';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const { t } = useLanguage();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo(
    () => [
      {
        id: '1',
        title: t('pages.onboarding1Title') || 'Donate Blood,',
        accent: t('pages.onboarding1Accent') || 'Save Lives',
        subtitle:
          t('pages.onboarding1Sub') ||
          'Join our verified community to connect with donors and save lives in your neighborhood.',
        Illustration: DonationIllustration,
        features: [
          { icon: 'navigate-outline', text: t('pages.onboarding1Feat1') || 'Find nearby compatible donors' },
          { icon: 'calendar-outline', text: t('pages.onboarding1Feat2') || 'Schedule appointments easily' },
          { icon: 'notifications-outline', text: t('pages.onboarding1Feat3') || 'Receive real-time donor updates' },
          { icon: 'heart-outline', text: t('pages.onboarding1Feat4') || 'Track your personal donation history' },
        ],
      },
      {
        id: '2',
        title: t('pages.onboarding2Title') || 'Emergency SOS,',
        accent: t('pages.onboarding2Accent') || 'Instant Matching',
        subtitle:
          t('pages.onboarding2Sub') ||
          'Broadcast urgent blood requests and find the closest available donors on a live interactive map.',
        Illustration: EmergencyMatchIllustration,
        features: [
          { icon: 'flash-outline', text: t('pages.onboarding2Feat1') || 'Smart matching for all blood types' },
          { icon: 'radio-outline', text: t('pages.onboarding2Feat2') || 'Live GPS radar & donor tracking' },
          { icon: 'alert-circle-outline', text: t('pages.onboarding2Feat3') || 'Instant push alerts for critical needs' },
          { icon: 'call-outline', text: t('pages.onboarding2Feat4') || 'Direct call & hospital directions' },
        ],
      },
      {
        id: '3',
        title: t('pages.onboarding3Title') || 'Verified Banks,',
        accent: t('pages.onboarding3Accent') || 'Earn Rewards',
        subtitle:
          t('pages.onboarding3Sub') ||
          'Safely log donations with QR codes at certified blood banks and unlock life-saver badges and perks.',
        Illustration: VerifiedRewardsIllustration,
        features: [
          { icon: 'shield-checkmark-outline', text: t('pages.onboarding3Feat1') || '100% verified hospital & bank network' },
          { icon: 'qr-code-outline', text: t('pages.onboarding3Feat2') || 'Contactless QR donor verification' },
          { icon: 'time-outline', text: t('pages.onboarding3Feat3') || 'Automated 90-day eligibility tracker' },
          { icon: 'trophy-outline', text: t('pages.onboarding3Feat4') || 'Earn Life-Saver points and badges' },
        ],
      },
    ],
    [t]
  );

  const finishOnboarding = useCallback(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      return;
    }
    navigation.navigate('Login');
  }, [navigation, user]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const handleDotPress = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const onMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (SCREEN_WIDTH - 48));
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const renderSlide = ({ item }) => {
    const { Illustration } = item;
    return (
      <View style={styles.slideWrap}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {item.title}{'\n'}
            <Text style={styles.titleAccent}>{item.accent}</Text>
          </Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>

        <Illustration />

        <View style={styles.features}>
          {item.features.map((feat) => (
            <View key={feat.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feat.icon} size={15} color={colors.primary} />
              </View>
              <Text style={styles.feature}>{feat.text}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BloodDrop size={20} />
          <Text style={styles.brand}>HemoGo</Text>
        </View>
        {!isLast ? (
          <TouchableOpacity onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('pages.skip') || 'Skip'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH - 48,
          offset: (SCREEN_WIDTH - 48) * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, idx) => {
            const active = idx === currentIndex;
            return (
              <TouchableOpacity
                key={slide.id}
                onPress={() => handleDotPress(idx)}
                hitSlop={8}
                style={[styles.dot, active && styles.dotActive]}
              />
            );
          })}
        </View>

        <Button
          title={isLast ? (t('pages.getStarted') || 'Get Started') : (t('pages.next') || 'Next')}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      minHeight: 36,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brand: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    skipBtn: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    headerSpacer: {
      width: 40,
    },
    listContent: {
      alignItems: 'center',
    },
    slideWrap: {
      width: SCREEN_WIDTH - 48,
      paddingTop: 20,
      justifyContent: 'space-between',
    },
    textContainer: {
      minHeight: 110,
    },
    title: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.8,
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    features: {
      marginTop: 8,
      marginBottom: 12,
      gap: 10,
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
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    footer: {
      paddingBottom: 16,
      paddingTop: 4,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 22,
      backgroundColor: colors.primary,
    },
  });

export default OnboardingScreen;
