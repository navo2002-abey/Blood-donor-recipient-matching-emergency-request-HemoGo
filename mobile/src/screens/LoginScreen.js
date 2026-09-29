import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';
import { getApiErrorMessage } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter your email/phone and password.');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Login failed', getApiErrorMessage(error, 'Invalid login details.'));
    } finally {
      setLoading(false);
    }
  };

  const comingSoon = (feature) => {
    Alert.alert('Coming Soon', `${feature} will be available in a later version.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.topLink} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.topLinkText}>Sign Up</Text>
          </TouchableOpacity>

          <View style={styles.center}>
            <Logo />
            <Text style={styles.heading}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Log in to continue</Text>
          </View>

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email / Phone"
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={styles.forgot} onPress={() => comingSoon('Forgot Password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Login" onPress={handleLogin} loading={loading} disabled={loading} />

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.social} onPress={() => comingSoon('Google login')}>
              <Ionicons name="logo-google" size={22} color="#4285F4" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.social} onPress={() => comingSoon('Apple login')}>
              <Ionicons name="logo-apple" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <Text style={styles.bottomText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  topLink: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  topLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  center: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  heading: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -6,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignSelf: 'center',
  },
  social: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  bottomText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  bottomLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default LoginScreen;
