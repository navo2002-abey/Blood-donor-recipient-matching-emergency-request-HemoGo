import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const SplashScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { restoreSession } = useAuth();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2300,
        useNativeDriver: false,
      }),
    ]).start();

    const boot = async () => {
      const wait = new Promise((resolve) => setTimeout(resolve, 2400));
      await Promise.all([restoreSession(), wait]);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    };

    boot();
  }, [fadeAnim, navigation, progressAnim, restoreSession, scaleAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />

      <Animated.View
        style={[
          styles.center,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoGlow}>
          <Logo size="lg" titleColor={colors.primary} tagline={t('pages.tagline')} />
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width: progressWidth }]} />
        </View>
        <Text style={styles.footer}>{t('pages.splashFooter')}</Text>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
  },
  bgCircleOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primarySoft,
    top: 90,
    alignSelf: 'center',
    opacity: 0.7,
  },
  bgCircleTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.cardBg,
    top: 140,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    alignItems: 'center',
  },
  bottom: {
    paddingBottom: 28,
    alignItems: 'center',
  },
  track: {
    width: 92,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

export default SplashScreen;
