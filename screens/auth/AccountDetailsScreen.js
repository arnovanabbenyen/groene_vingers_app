import React from 'react';
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
import { useRegisterForm } from '../../hooks/useRegisterForm';
export default function AccountDetailsScreen({ onBack, onContinue, onLogin }) {
  const insets = useSafeAreaInsets();
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
    validate,
  } = useRegisterForm();

  function onPressContinue() {
    if (!validate()) return;
    onContinue?.({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
    });
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
            accessibilityLabel="Terug"
            hitSlop={8}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>

          <Text style={styles.title}>Maak je account</Text>
          <Text style={styles.subtitle}>Jouw gegevens zijn veilig bij ons.</Text>

          <FormErrorBanner message={bannerError} />

          <View style={styles.row}>
            <AuthTextField
              label="Voornaam"
              value={values.firstName}
              onChangeText={setFirstName}
              halfWidth
              accessibilityLabel="Voornaam"
              autoCapitalize="words"
            />
            <AuthTextField
              label="Achternaam"
              value={values.lastName}
              onChangeText={setLastName}
              halfWidth
              accessibilityLabel="Achternaam"
              autoCapitalize="words"
            />
          </View>

          <AuthTextField
            label="E-mailadres"
            value={values.email}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="jouw@email.be"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
            error={!!errors.email}
            accessibilityLabel="E-mailadres"
          />
          {errors.email ? <FieldError message={errors.email} /> : null}

          <AuthTextField
            label="Wachtwoord"
            value={values.password}
            onChangeText={handlePasswordChange}
            onBlur={handlePasswordBlur}
            placeholder="••••••••••"
            secureTextEntry
            autoComplete="password-new"
            icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
            error={!!errors.password}
            accessibilityLabel="Wachtwoord"
            accessibilityHint="Minimaal 8 tekens, een hoofdletter, een cijfer en een speciaal teken"
          />
          <PasswordStrengthBar strength={strength} />
          {errors.password ? <FieldError message={errors.password} /> : null}

          <AuthCheckbox
            checked={values.acceptedTerms}
            onToggle={toggleTerms}
            error={!!errors.terms}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: values.acceptedTerms }}
            accessibilityLabel="Akkoord met gebruiksvoorwaarden en privacybeleid"
          >
            {'Ik ga akkoord met de '}
            <Text style={styles.termsLink} onPress={onPressLegalLink}>Gebruiksvoorwaarden</Text>
            {' en het '}
            <Text style={styles.termsLink} onPress={onPressLegalLink}>Privacybeleid</Text>
          </AuthCheckbox>
          {errors.terms ? <FieldError message={errors.terms} /> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AuthButton
            label="Volgende"
            onPress={onPressContinue}
            variant="primary"
          />
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Al een account? </Text>
            <Pressable onPress={onLogin} hitSlop={4}>
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
  backRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText:      { fontFamily: FONTS.displayMedium, fontSize: 16, color: COLORS.textPrimary },
  title:         { fontFamily: FONTS.displaySemiBold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 4 },
  subtitle:      { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  row:           { flexDirection: 'row', gap: 12 },
  termsLink:     { fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary, textDecorationLine: 'underline' },
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
