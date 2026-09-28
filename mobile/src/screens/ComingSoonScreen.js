import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { BloodDrop } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';

const ComingSoonScreen = ({ title, showLogout = false, navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <BloodDrop size={42} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.copy}>This feature will be added in a later version of HemoGo.</Text>
        {showLogout ? (
          <Button title="Log Out" onPress={handleLogout} style={styles.logout} />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  copy: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  logout: {
    marginTop: 28,
    minWidth: 180,
  },
});

export default ComingSoonScreen;
