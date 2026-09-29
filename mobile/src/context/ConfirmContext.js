import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../utils/colors';

const ConfirmContext = createContext(null);

const ConfirmModal = ({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  const content = (
    <View style={styles.overlay} pointerEvents="auto">
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.card}>
        <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
          <Ionicons
            name={destructive ? 'trash-outline' : 'help-circle-outline'}
            size={26}
            color={destructive ? colors.primary : colors.text}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, destructive && styles.confirmBtnDanger]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ✅ Web: absolute-positioned INSIDE the phone frame
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrap} pointerEvents="box-none">
        {content}
      </View>
    );
  }

  // ✅ Native: use Modal
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      {content}
    </Modal>
  );
};

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState(options || {});
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) resolver(true);
    setState(null);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) resolver(false);
    setState(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        visible={!!state}
        title={state?.title}
        message={state?.message}
        confirmText={state?.confirmText}
        cancelText={state?.cancelText}
        destructive={state?.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside ConfirmProvider');
  }
  return ctx;
};

const styles = StyleSheet.create({
  webWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapDanger: {
    backgroundColor: colors.primarySoft,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDanger: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
});