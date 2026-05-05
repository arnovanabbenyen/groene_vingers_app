import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { ArrowLeft, EnvelopeSimple, LockKey } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';
import AuthTextField from '../../components/auth/AuthTextField';
import AuthCheckbox from '../../components/auth/AuthCheckbox';

export default function AccountDetailsScreen({ onBack, onContinue, onLogin, role }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleContinue() {
    if (!acceptedTerms) {
      Alert.alert('Bevestig de voorwaarden', 'Je moet akkoord gaan met de gebruiksvoorwaarden en het privacybeleid.');
      return;
    }

    onContinue?.({
      role,
      firstName,
      lastName,
      email,
      password,
      acceptedTerms,
    });
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
        onChangeText={setEmail}
        placeholder="jouw@email.be"
        keyboardType="email-address"
        autoCapitalize="none"
        icon={<EnvelopeSimple size={18} color={COLORS.border} weight="regular" />}
      />

      <AuthTextField
        label="Wachtwoord"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••••"
        secureTextEntry
        icon={<LockKey size={18} color={COLORS.border} weight="regular" />}
      />

      <AuthCheckbox checked={acceptedTerms} onToggle={() => setAcceptedTerms((value) => !value)}>
        Ik ga akkoord met de <Text style={styles.termsLink}>Gebruiksvoorwaarden</Text> en het <Text style={styles.termsLink}>Privacybeleid</Text>
      </AuthCheckbox>

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
