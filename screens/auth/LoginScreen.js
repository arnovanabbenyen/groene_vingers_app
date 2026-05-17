import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { EnvelopeSimple, LockKey } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import ErrorAlert from '../../components/auth/ErrorAlert';
import { supabase } from '../../services/supabase';

export default function LoginScreen({ onCreateAccount, onLoginSuccess, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Velden invullen', 'Vul je e-mailadres en wachtwoord in.');
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Try to get role from user metadata first
        const user = data.user;
        let role = user?.user_metadata?.role || null;

        // Fallback: try to read from profiles table
        if (!role) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            if (!profileError && profileData?.role) {
              role = profileData.role;
            }
          } catch (e) {
            // ignore
          }
        }

        onLoginSuccess?.(role);
      }
    } catch (loginError) {
      setError('E-mailadres of wachtwoord is onjuist.');
      setFieldErrors({ email: true, password: true });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Login</Text>

      <ErrorAlert message={error} />

      <AuthTextField
        label="E-mailadres"
        value={email}
          onChangeText={(newEmail) => {
            setEmail(newEmail);
            setError('');
            setFieldErrors(prev => ({ ...prev, email: false }));
          }}
        placeholder="jouw@email.be"
        keyboardType="email-address"
        autoCapitalize="none"
          error={fieldErrors.email}
        icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
      />

      <View style={styles.passwordSection}>
        <AuthTextField
          label="Wachtwoord"
          value={password}
            onChangeText={(newPassword) => {
              setPassword(newPassword);
              setError('');
              setFieldErrors(prev => ({ ...prev, password: false }));
            }}
          placeholder="••••••••••"
          secureTextEntry
            error={fieldErrors.password}
          icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
        />
        <Pressable style={styles.forgotPasswordContainer} onPress={onForgotPassword}>
          <Text style={styles.forgotPassword}>Wachtwoord vergeten?</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <AuthButton 
          label="Inloggen" 
          onPress={handleLogin} 
          variant="primary"
          disabled={isLoading}
        />
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Nog geen account? </Text>
          <Pressable onPress={onCreateAccount}>
            <Text style={styles.signupLink}>Registreer je hier</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 72,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 32,
  },
  passwordSection: {
    marginTop: 16,
  },
  forgotPasswordContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  forgotPassword: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.8,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 48,
  },
  signupRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  signupLink: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
});
