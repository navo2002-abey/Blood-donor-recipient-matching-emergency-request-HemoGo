import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

const TOAST_THEMES = {
  emergency: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    titleColor: '#DC2626',
    icon: 'warning',
    iconColor: '#DC2626',
    badge: 'EMERGENCY',
  },
  success: {
    bg: '#F0FDF4',
    border: '#86EFAC',
    titleColor: '#16A34A',
    icon: 'checkmark-circle',
    iconColor: '#16A34A',
    badge: 'SUCCESS',
  },
  info: {
    bg: '#EFF6FF',
    border: '#93C5FD',
    titleColor: '#2563EB',
    icon: 'information-circle',
    iconColor: '#2563EB',
    badge: 'INFO',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    titleColor: '#D97706',
    icon: 'alert-circle',
    iconColor: '#D97706',
    badge: 'REMINDER',
  },
};

export const ToastProvider = ({ children }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const hideToast = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    ({
      type = 'info',
      title = '',
      message = '',
      duration = 4500,
      onPress = null,
      icon = null,
    }) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      setToast({
        type,
        title,
        message,
        onPress,
        icon,
      });

      // Animate in from top
      translateY.setValue(-140);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        hideTimer.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    },
    [translateY, opacity, hideToast]
  );

  // Pan gesture to allow swiping up to dismiss
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -20 || gestureState.vy < -0.5) {
            hideToast();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [translateY, hideToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  const currentTheme = toast
    ? TOAST_THEMES[toast.type] || TOAST_THEMES.info
    : TOAST_THEMES.info;

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 14) + 6;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {toast && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.container,
            {
              top: topOffset,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? colors.cardBg : currentTheme.bg,
                borderColor: isDark ? colors.border : currentTheme.border,
              },
            ]}
            onPress={() => {
              if (toast.onPress) {
                toast.onPress();
              }
              hideToast();
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: currentTheme.iconColor + '18' },
              ]}
            >
              <Ionicons
                name={toast.icon || currentTheme.icon}
                size={22}
                color={currentTheme.iconColor}
              />
            </View>

            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? colors.text : currentTheme.titleColor },
                  ]}
                  numberOfLines={1}
                >
                  {toast.title}
                </Text>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: currentTheme.iconColor + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: currentTheme.iconColor },
                    ]}
                  >
                    {currentTheme.badge}
                  </Text>
                </View>
              </View>

              {toast.message ? (
                <Text
                  style={[
                    styles.message,
                    { color: isDark ? colors.textSecondary : '#475569' },
                  ]}
                  numberOfLines={2}
                >
                  {toast.message}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              hitSlop={10}
              onPress={hideToast}
              style={styles.closeBtn}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? colors.textMuted : '#94A3B8'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
