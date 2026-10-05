import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../utils/colors';
import { useTheme } from '../context/ThemeContext';

const DonationIllustration = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Svg width={220} height={150} viewBox="0 0 220 150">
        <Path
          d="M18 108 C48 96 72 74 92 58 C78 86 62 108 40 122 C28 128 20 120 18 108 Z"
          fill={colors.illustrationSkin}
        />
        <Path
          d="M202 108 C172 96 148 74 128 58 C142 86 158 108 180 122 C192 128 200 120 202 108 Z"
          fill={colors.illustrationSkinDark}
        />
        <Path
          d="M110 22 C110 22 86 48 86 68 C86 82 96 92 110 92 C124 92 134 82 134 68 C134 48 110 22 110 22 Z"
          fill={colors.primary}
        />
      </Svg>
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primarySoft,
  },
});

export default DonationIllustration;
