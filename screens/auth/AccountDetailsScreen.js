import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, EnvelopeSimple, LockKey } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthCheckbox from '../../components/auth/AuthCheckbox';
import FieldError from '../../components/notifications/FieldError';
import FormErrorBanner from '../../components/notifications/FormErrorBanner';
import PasswordStrengthBar from '../../components/auth/PasswordStrengthBar';
import AuthProgressBar from '../../components/auth/AuthProgressBar';
import { useRegisterForm } from '../../hooks/useRegisterForm';
import { supabase } from '../../services/supabase';

export default function AccountDetailsScreen({ onBack, onContinue, onLogin }) {
  const insets = useSafeAreaInsets();
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const {
    values,
    setFirstName,
    setLastName,
    toggleTerms,
    handleEmailChange,
    handlePasswordChange,
    handleEmailBlur,
    handlePasswordBlur,
    errors,
    bannerError,
    strength,
    submitting,
    setSubmitting,
    validate,
    validateEmailFormat,
    setSignupError,
  } = useRegisterForm();

  async function checkEmailOnBlur() {
    handleEmailBlur();
    const email = values.email.trim();
    if (!email || !supabase || validateEmailFormat(email)) return;
    try {
      const { data: isAvailable } = await supabase
        .rpc('check_email_available', { p_email: email });
      if (isAvailable === false) {
        setSignupError({ message: 'User already registered' });
      }
    } catch {
      // silent — submit-check vangt het op
    }
  }

  async function onPressContinue() {
    if (!validate()) return;
    if (!supabase) {
      onContinue?.({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: isAvailable, error: rpcError } = await supabase
        .rpc('check_email_available', { p_email: values.email.trim() });

      if (rpcError) throw rpcError;

      if (!isAvailable) {
        setSignupError({ message: 'User already registered' });
        return;
      }

      onContinue?.({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch {
      // RPC onbeschikbaar: laat de gebruiker doorgaan, signUp zelf vangt het op
      onContinue?.({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function onPressLegalLink() {
    Alert.alert(
      'Komt binnenkort',
      'Onze gebruiksvoorwaarden en privacybeleid zijn nog in ontwikkeling.',
      [{ text: 'OK' }],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthProgressBar step={1} totalSteps={4} />
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
          <Pressable
            style={styles.backRow}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Terug naar rolkeuze"
            hitSlop={16}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>

          <Text style={styles.title}>Maak je account</Text>
          <Text style={styles.subtitle}>Je wachtwoord wordt versleuteld opgeslagen en nooit gedeeld.</Text>

          <FormErrorBanner message={bannerError} />

          <View style={styles.row}>
            <AuthTextField
              label="Voornaam"
              value={values.firstName}
              onChangeText={setFirstName}
              halfWidth
              autoFocus
              autoCapitalize="words"
              textContentType="givenName"
              autoComplete="given-name"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => lastNameRef.current?.focus()}
              accessibilityLabel="Voornaam"
            />
            <AuthTextField
              ref={lastNameRef}
              label="Achternaam"
              value={values.lastName}
              onChangeText={setLastName}
              halfWidth
              autoCapitalize="words"
              textContentType="familyName"
              autoComplete="family-name"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
              accessibilityLabel="Achternaam"
            />
          </View>

          <AuthTextField
            ref={emailRef}
            label="E-mailadres"
            value={values.email}
            onChangeText={handleEmailChange}
            onBlur={checkEmailOnBlur}
            placeholder="jouw@email.be"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
            error={!!errors.email}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="E-mailadres"
          />
          {errors.email ? <FieldError message={errors.email} /> : null}

          <AuthTextField
            ref={passwordRef}
            label="Wachtwoord"
            value={values.password}
            onChangeText={handlePasswordChange}
            onBlur={handlePasswordBlur}
            placeholder="••••••••••"
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
            error={!!errors.password}
            returnKeyType="done"
            onSubmitEditing={onPressContinue}
            accessibilityLabel="Wachtwoord"
            accessibilityHint="Minimaal 8 tekens, een hoofdletter, een cijfer en een speciaal teken"
          />
          <PasswordStrengthBar strength={strength} />
          {errors.password ? <FieldError message={errors.password} /> : null}

          <AuthCheckbox
            checked={values.acceptedTerms}
            onToggle={toggleTerms}
            error={!!errors.terms}
            accessibilityLabel="Akkoord met gebruiksvoorwaarden en privacybeleid"
          >
            {'Ik ga akkoord met de '}
            <Text
              style={styles.termsLink}
              onPress={onPressLegalLink}
              accessibilityRole="link"
              accessibilityLabel="Gebruiksvoorwaarden openen"
            >
              Gebruiksvoorwaarden
            </Text>
            {' en het '}
            <Text
              style={styles.termsLink}
              onPress={onPressLegalLink}
              accessibilityRole="link"
              accessibilityLabel="Privacybeleid openen"
            >
              Privacybeleid
            </Text>
          </AuthCheckbox>
          {errors.terms ? <FieldError message={errors.terms} /> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AuthButton
            label="Volgende"
            onPress={onPressContinue}
            variant="primary"
            loading={submitting}
            disabled={submitting}
          />
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Al een account? </Text>
            <Pressable
              onPress={onLogin}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="Inloggen op bestaand account"
            >
              <Text style={styles.loginLink}>Inloggen</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.background },
  kav:           { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.screenX, paddingTop: 16, paddingBottom: 24 },
  backRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText:      { fontFamily: FONTS.displayMedium, fontSize: 16, color: COLORS.textPrimary },
  title:     { fontFamily: FONTS.displaySemiBold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 4 },
  subtitle:  { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  row:       { flexDirection: 'row', gap: 12 },
  termsLink: { fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary, textDecorationLine: 'underline' },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  loginRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  loginText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary },
  loginLink: { fontFamily: FONTS.displaySemiBold, fontSize: 14, color: COLORS.textPrimary },
});
