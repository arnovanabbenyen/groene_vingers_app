import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnvelopeSimple, LockKey } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import ErrorAlert from '../../components/auth/ErrorAlert';
import { supabase } from '../../services/supabase';

export default function LoginScreen({ onCreateAccount, onLoginSuccess, onForgotPassword }) {
  const insets = useSafeAreaInsets();
  const passwordRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  function clearError() {
    if (!error) return;
    setError('');
    setFieldErrors({ email: false, password: false });
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Vul je e-mailadres en wachtwoord in.');
      setFieldErrors({ email: !email.trim(), password: !password });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) throw loginError;

      if (data?.user) {
        let role = data.user.user_metadata?.role || null;
        if (!role) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();
            if (profile?.role) role = profile.role;
          } catch { /* ignore — onAuthStateChange handles role fallback */ }
        }
        onLoginSuccess?.(role);
      }
    } catch (err) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('email not confirmed')) {
        setError('Bevestig eerst je e-mailadres via de link in je mailbox.');
        setFieldErrors({ email: true, password: false });
      } else {
        setError('E-mailadres of wachtwoord is onjuist.');
        setFieldErrors({ email: true, password: true });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Inloggen</Text>

          <ErrorAlert message={error} />

          <AuthTextField
            label="E-mailadres"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError(); }}
            placeholder="jouw@email.be"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus
            error={fieldErrors.email}
            icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="E-mailadres"
          />

          <View style={styles.passwordWrap}>
            <AuthTextField
              ref={passwordRef}
              label="Wachtwoord"
              value={password}
              onChangeText={(v) => { setPassword(v); clearError(); }}
              placeholder="••••••••••"
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              error={fieldErrors.password}
              icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Wachtwoord"
            />
            <Pressable
              style={styles.forgotWrap}
              onPress={onForgotPassword}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Wachtwoord vergeten"
            >
              <Text style={styles.forgotText}>Wachtwoord vergeten?</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton
            label="Inloggen"
            onPress={handleLogin}
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          />
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Nog geen account? </Text>
            <Pressable
              onPress={onCreateAccount}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Registreer je hier"
            >
              <Text style={styles.signupLink}>Registreer je hier</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  passwordWrap: {
    marginBottom: SPACING.sm,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
  },
  forgotText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
  signupRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  signupLink: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
});
