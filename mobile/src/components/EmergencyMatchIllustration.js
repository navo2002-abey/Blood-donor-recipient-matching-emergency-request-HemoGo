import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const EmergencyMatchIllustration = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Svg width={220} height={150} viewBox="0 0 220 150">
        {/* Radar Concentric Circles */}
        <Circle cx="110" cy="75" r="62" stroke={colors.primary} strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.25" fill="none" />
        <Circle cx="110" cy="75" r="44" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
        <Circle cx="110" cy="75" r="26" stroke={colors.primary} strokeWidth="2" strokeOpacity="0.65" fill={colors.primarySoft} />

        {/* Outer Donor Beacon Dots */}
        <G>
          <Circle cx="60" cy="45" r="9" fill="#1D4ED8" />
          <Circle cx="60" cy="45" r="14" stroke="#60A5FA" strokeWidth="2" strokeOpacity="0.5" fill="none" />
          <Path d="M57 45 H63 M60 42 V48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </G>

        <G>
          <Circle cx="165" cy="50" r="9" fill="#16A34A" />
          <Circle cx="165" cy="50" r="14" stroke="#86EFAC" strokeWidth="2" strokeOpacity="0.5" fill="none" />
          <Path d="M162 50 H168 M165 47 V53" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </G>

        <G>
          <Circle cx="155" cy="112" r="8" fill="#D97706" />
          <Circle cx="155" cy="112" r="13" stroke="#FDE68A" strokeWidth="2" strokeOpacity="0.5" fill="none" />
          <Path d="M152 112 H158 M155 109 V115" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </G>

        {/* Pulse connecting lines */}
        <Path d="M60 45 Q 85 60 110 75" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 3" strokeOpacity="0.6" fill="none" />
        <Path d="M165 50 Q 138 62 110 75" stroke="#22C55E" strokeWidth="2" strokeDasharray="3 3" strokeOpacity="0.6" fill="none" />
        <Path d="M155 112 Q 132 94 110 75" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" strokeOpacity="0.6" fill="none" />

        {/* Center Emergency Pin / SOS Beacon */}
        <G>
          {/* Blood Drop with Heart */}
          <Path
            d="M110 46 C110 46 95 65 95 78 C95 87 101.5 94 110 94 C118.5 94 125 87 125 78 C125 65 110 46 110 46 Z"
            fill={colors.primary}
          />
          {/* Lightning / SOS mark inside */}
          <Path
            d="M111 62 L105 73 H110 L109 84 L116 71 H111 L114 62 Z"
            fill="#FFFFFF"
          />
        </G>
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

export default EmergencyMatchIllustration;
