import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function WelcomeScreen({ onContinue, emailVerificationRequired = false }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <CheckCircle size={72} color={COLORS.brand} weight="fill" />
        </View>

        <Text style={styles.title}>Welkom bij Groene Vingers</Text>
        <Text style={styles.subtitle}>
          {emailVerificationRequired
            ? 'Je account is aangemaakt. Controleer je e-mail om je account te bevestigen.'
            : 'Je profiel is compleet. Je kunt nu meteen aan de slag.'}
        </Text>
      </View>

      <View style={styles.footer}>
        <AuthButton
          label={emailVerificationRequired ? 'Naar inloggen' : 'Start'}
          onPress={onContinue}
          variant="primary"
        />
        <Text style={styles.helperText}>
          {emailVerificationRequired
            ? 'Na verificatie kan je meteen inloggen.'
            : 'Je kan je profiel later altijd aanpassen.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 118,
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(87,98,56,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 25,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 340,
    lineHeight: 23,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: SPACING.lg,
  },
  helperText: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
