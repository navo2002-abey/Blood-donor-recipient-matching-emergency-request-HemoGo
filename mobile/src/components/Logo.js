import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../utils/colors';

export const BloodDrop = ({ size = 42 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Path
      d="M32 4C32 4 12 28 12 42c0 11 9 18 20 18s20-7 20-18C52 28 32 4 32 4z"
      fill={colors.primary}
    />
  </Svg>
);

const Logo = ({ size = 'md', showText = true, tagline, align = 'center', titleColor }) => {
  const dropSize = size === 'lg' ? 78 : size === 'sm' ? 22 : 42;
  const titleSize = size === 'lg' ? 34 : size === 'sm' ? 18 : 24;

  return (
    <View style={[styles.wrap, align === 'left' && styles.left]}>
      <BloodDrop size={dropSize} />
      {showText ? (
        <Text style={[styles.title, { fontSize: titleSize, color: titleColor || colors.text }]}>
          HemoGo
        </Text>
      ) : null}
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  left: {
    alignItems: 'flex-start',
  },
  title: {
    marginTop: 10,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default Logo;
