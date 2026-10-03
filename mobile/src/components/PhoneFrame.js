import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

const PhoneFrame = ({ children }) => {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.style.height = '100%';
    body.style.margin = '0';
    body.style.height = '100%';
    body.style.background = isDark ? '#0B0D11' : '#D7D9DE';
    body.style.overflow = 'hidden';
    if (root) {
      root.style.height = '100%';
      root.style.overflow = 'hidden';
    }

    const styleId = 'hide-scrollbars';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }

        *::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `;
      document.head.appendChild(style);
    }

    return undefined;
  }, [isDark]);

  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={[styles.stage, { backgroundColor: isDark ? '#0B0D11' : '#D7D9DE' }]}>
      <View style={styles.phone}>
        <View style={styles.notch} />
        <View style={[styles.screen, { backgroundColor: colors.page }]}>{children}</View>
        <View style={styles.homeBar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7D9DE',
    paddingVertical: 24,
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#111111',
    borderRadius: 42,
    borderWidth: 10,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
  },
  notch: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 118,
    height: 28,
    borderRadius: 16,
    backgroundColor: '#111111',
    zIndex: 20,
    left: (PHONE_WIDTH - 118) / 2 - 10,
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingTop: 48,
  },
  homeBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 128,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#111111',
    zIndex: 20,
    left: (PHONE_WIDTH - 128) / 2 - 10,
  },
});

export default PhoneFrame;