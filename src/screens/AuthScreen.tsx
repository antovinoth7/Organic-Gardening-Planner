import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import FloatingLabelInput from '../components/FloatingLabelInput';
import { createStyles } from '../styles/authStyles';
import { getErrorCode, logAuthError } from '../utils/errorLogging';

const MAX_AUTH_ATTEMPTS = 5;
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MIN_PASSWORD_LENGTH = 8;

const isStrongPassword = (pwd: string): boolean => {
  return pwd.length >= MIN_PASSWORD_LENGTH && /[A-Z]/.test(pwd) && /\d/.test(pwd);
};

export default function AuthScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const authAttempts = useRef<number[]>([]);

  const isRateLimited = useCallback((): boolean => {
    const now = Date.now();
    authAttempts.current = authAttempts.current.filter(t => now - t < AUTH_WINDOW_MS);
    return authAttempts.current.length >= MAX_AUTH_ATTEMPTS;
  }, []);

  const recordAttempt = useCallback(() => {
    authAttempts.current.push(Date.now());
  }, []);

  const handleAuth = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (isSignUp && !isStrongPassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters and include an uppercase letter and a number.');
      return;
    }

    if (!isSignUp && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (isRateLimited()) {
      Alert.alert('Too Many Attempts', 'Please wait 15 minutes before trying again.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: unknown) {
      recordAttempt();
      const code = getErrorCode(error);
      logAuthError(`Auth failed: ${code ?? 'unknown'}`, error instanceof Error ? error : undefined);

      let message: string;
      if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else {
        message = 'Invalid email or password. Please try again.';
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="leaf" size={64} color={theme.primary} />
          <Text style={styles.title}>Garden Planner</Text>
          <Text style={styles.subtitle}>Track your plants, tasks & journal</Text>
        </View>

        <View style={styles.form}>
          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <FloatingLabelInput
            label={isSignUp ? "Password (min 8 chars, 1 uppercase, 1 number)" : "Password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
