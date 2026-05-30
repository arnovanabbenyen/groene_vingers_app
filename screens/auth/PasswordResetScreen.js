import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnvelopeSimple } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthStepHeader from '../../components/auth/AuthStepHeader';
import ErrorAlert from '../../components/auth/ErrorAlert';
import { supabase } from '../../services/supabase';

export default function PasswordResetScreen({ onBack, onSent, initialEmail }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendReset() {
    if (!email.trim()) {
      setError('Voer je e-mailadres in om verder te gaan.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: 'groenevingers://' },
      );
      if (resetError) throw resetError;
      onSent?.(email.trim());
    } catch {
      setError('Er liep iets mis. Controleer het e-mailadres en probeer opnieuw.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <AuthStepHeader
          onBack={onBack}
          backAccessibilityLabel="Terug naar inloggen"
        />
      </View>

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
          <Text style={styles.title}>Wachtwoord vergeten?</Text>
          <Text style={styles.subtitle}>
            Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
          </Text>

          <ErrorAlert message={error} />

          <AuthTextField
            label="E-mailadres"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            placeholder="jouw@email.be"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus={!initialEmail}
            error={!!error}
            icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
            returnKeyType="done"
            onSubmitEditing={handleSendReset}
            accessibilityLabel="E-mailadres"
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton
            label="Verstuur resetlink"
            onPress={handleSendReset}
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          />
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
  headerWrap: {
    paddingHorizontal: SPACING.screenX,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
  },
});
