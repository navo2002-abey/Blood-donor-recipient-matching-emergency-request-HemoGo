import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, G, Polygon } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const VerifiedRewardsIllustration = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Svg width={220} height={150} viewBox="0 0 220 150">
        {/* Background Card / Shield Base */}
        <Path
          d="M110 24 L152 40 C152 74 135 106 110 120 C85 106 68 74 68 40 Z"
          fill={colors.primarySoft}
          stroke={colors.primary}
          strokeWidth="2"
        />

        {/* QR Code / Hospital Symbol elements */}
        {/* Inner Shield */}
        <Path
          d="M110 35 L142 48 C142 75 128 100 110 110 C92 100 78 75 78 48 Z"
          fill={colors.cardBg || '#FFFFFF'}
          stroke="#F3B4BC"
          strokeWidth="1.5"
        />

        {/* Medical Cross in center */}
        <Path
          d="M104 54 H116 V64 H126 V76 H116 V86 H104 V76 H94 V64 H104 Z"
          fill={colors.primary}
        />

        {/* Verified Badge Checkmark (floating bottom right) */}
        <G>
          <Circle cx="150" cy="96" r="16" fill="#16A34A" />
          <Circle cx="150" cy="96" r="20" stroke="#86EFAC" strokeWidth="2" strokeOpacity="0.45" fill="none" />
          <Path
            d="M144 96 L148 100 L157 91"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>

        {/* Golden Star / Achievement Medal (floating top left) */}
        <G>
          <Circle cx="70" cy="46" r="14" fill="#F59E0B" />
          <Circle cx="70" cy="46" r="18" stroke="#FDE68A" strokeWidth="2" strokeOpacity="0.45" fill="none" />
          {/* 5-point star */}
          <Polygon
            points="70,39 72.5,44 78,44.5 74,48.5 75,54 70,51 65,54 66,48.5 62,44.5 67.5,44"
            fill="#FFFFFF"
          />
        </G>

        {/* Little decorative sparkles */}
        <Circle cx="160" cy="36" r="3" fill={colors.primary} />
        <Circle cx="54" cy="90" r="2.5" fill="#3B82F6" />
        <Circle cx="172" cy="68" r="2" fill="#F59E0B" />
      </Svg>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
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

export default VerifiedRewardsIllustration;
