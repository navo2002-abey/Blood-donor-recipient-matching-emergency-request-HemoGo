import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';
import { BloodDrop } from './Logo';

const FeatureRow = ({ icon, title, hint, styles, colors }) => (
  <View style={styles.row}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowHint}>{hint}</Text>
    </View>
  </View>
);

const AppleSignInSheet = ({ visible, onClose, onContinue, onPrivacy }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button">
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.logoWrap}>
              <BloodDrop size={36} />
            </View>
            <Text style={styles.title}>{t('login.appleTitle')}</Text>
            <Text style={styles.intro}>{t('login.appleIntro')}</Text>
            <FeatureRow
              icon="hand-left-outline"
              title={t('login.applePrivacy')}
              hint={t('login.applePrivacyHint')}
              styles={styles}
              colors={colors}
            />
            <FeatureRow
              icon="flash-outline"
              title={t('login.appleFast')}
              hint={t('login.appleFastHint')}
              styles={styles}
              colors={colors}
            />
            <FeatureRow
              icon="mail-outline"
              title={t('login.appleHide')}
              hint={t('login.appleHideHint')}
              styles={styles}
              colors={colors}
            />
            <Text style={styles.fine}>
              {t('login.appleFine')}{' '}
              <Text style={styles.fineLink} onPress={onPrivacy}>
                {t('login.appleData')}
              </Text>
            </Text>
            <Button title={t('login.appleContinue')} onPress={onContinue} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    maxHeight: '88%',
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 8,
    paddingRight: 36,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  rowHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  fine: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  fineLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default AppleSignInSheet;
