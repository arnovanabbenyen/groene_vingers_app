import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { ArrowLeft, EnvelopeSimple, LockKey } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthCheckbox from '../../components/auth/AuthCheckbox';
import FieldError from '../../components/notifications/FieldError';
import { useFormValidation } from '../../hooks/useFormValidation';

export default function AccountDetailsScreen({ onBack, onContinue, onLogin, role }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const { validateEmailFormat, validatePassword, passwordStrength: calcStrength, checkEmailInUse } = useFormValidation();

  function handleContinue() {
    setAttemptedSubmit(true);
    setEmailTouched(true);
    setPasswordTouched(true);

    // validate fields
    const emailFormatError = validateEmailFormat(email);
    setEmailError(emailFormatError);

    const pwdError = validatePassword(password);
    setPasswordError(pwdError);

    if (!acceptedTerms) return;

    (async () => {
      if (!emailFormatError) {
        const inUse = await checkEmailInUse(email);
        if (inUse) {
          setEmailError('Vul een geldig e-mailadres in');
          return;
        }
      }

      if (emailFormatError || pwdError) return;

      if (attemptedSubmit) setAttemptedSubmit(false);

      onContinue?.({
        role,
        firstName,
        lastName,
        email,
        password,
        acceptedTerms,
      });
    })();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backRow} onPress={onBack}>
        <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
        <Text style={styles.backText}>Terug</Text>
      </Pressable>

      <Text style={styles.title}>Maak je account</Text>
      <Text style={styles.subtitle}>Jouw gegevens zijn veilig bij ons.</Text>

      <View style={styles.row}>
        <AuthTextField
          label="Voornaam"
          value={firstName}
          onChangeText={setFirstName}
          halfWidth
        />
        <AuthTextField
          label="Achternaam"
          value={lastName}
          onChangeText={setLastName}
          halfWidth
        />
      </View>

      <AuthTextField
        label="E-mailadres"
        value={email}
        onChangeText={(val) => { setEmail(val); if (emailError) setEmailError(''); }}
        onBlur={() => {
          setEmailTouched(true);
          const err = validateEmailFormat(email);
          setEmailError(err);
          if (!err) {
            // async check
            checkEmailInUse(email).then((inUse) => {
              if (inUse) setEmailError('Vul een geldig e-mailadres in');
            });
          }
        }}
        placeholder="jouw@email.be"
        keyboardType="email-address"
        autoCapitalize="none"
        icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
        error={!!emailError && (emailTouched || attemptedSubmit)}
        accessibilityLabel="E-mailadres"
        accessibilityHint="Vul je e-mailadres in"
      />

      {emailError && (emailTouched || attemptedSubmit) ? (
        <FieldError message={emailError} />
      ) : null}

      <AuthTextField
        label="Wachtwoord"
        value={password}
        onChangeText={(val) => { setPassword(val); setPasswordError(''); setPasswordStrength(calcStrength(val)); }}
        onBlur={() => { setPasswordTouched(true); setPasswordError(validatePassword(password)); }}
        placeholder="••••••••••"
        secureTextEntry
        icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
        error={!!passwordError && (passwordTouched || attemptedSubmit)}
        accessibilityLabel="Wachtwoord"
        accessibilityHint="Vul een wachtwoord in met minstens 8 tekens, een hoofdletter, een cijfer en een speciaal teken"
      />

      {passwordStrength ? (
        <Text style={[styles.strength, passwordStrength === 'weak' ? styles.weak : passwordStrength === 'medium' ? styles.medium : styles.strong]}>
          {passwordStrength === 'weak' ? 'Zwak' : passwordStrength === 'medium' ? 'Gemiddeld' : 'Sterk'}
        </Text>
      ) : null}

      {passwordError && (passwordTouched || attemptedSubmit) ? (
        <FieldError message={passwordError} />
      ) : null}

      <AuthCheckbox
        checked={acceptedTerms}
        onToggle={() => setAcceptedTerms((value) => {
          const next = !value;
          if (next) setAttemptedSubmit(false);
          return next;
        })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
        error={!acceptedTerms && attemptedSubmit}
      >
        Ik ga akkoord met de <Text style={styles.termsLink}>Gebruiksvoorwaarden</Text> en het <Text style={styles.termsLink}>Privacybeleid</Text>
      </AuthCheckbox>
      {!acceptedTerms && attemptedSubmit ? (
        <FieldError message="Je moet akkoord gaan met de voorwaarden" />
      ) : null}

      <View style={styles.footer}>
        <AuthButton label="Volgende" onPress={handleContinue} variant="primary" />
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Al een account? </Text>
          <Pressable onPress={onLogin || onBack}>
            <Text style={styles.loginLink}>Inloggen</Text>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textSecondary,
    marginBottom: 34,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  termsLink: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  footer: {
    marginTop: 36,
  },
  loginRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  loginLink: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
