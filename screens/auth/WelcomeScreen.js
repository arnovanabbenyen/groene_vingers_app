import React, { useEffect, useRef } from 'react';
import { AppState, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

const logo = require('../../assets/logo.png');

export default function WelcomeScreen({
  email,
  emailVerificationRequired = false,
  onConfirmed,
  onGoToLogin,
}) {
  const insets = useSafeAreaInsets();
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // Wanneer de app terugkomt van de browser (na e-mailbevestiging) → naar login
  useEffect(() => {
    if (!emailVerificationRequired) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && mountedRef.current) {
        onGoToLogin?.();
      }
    });
    return () => subscription.remove();
  }, [emailVerificationRequired, onGoToLogin]);

  function handleManualCheck() {
    onGoToLogin?.();
  }

  const titleText = emailVerificationRequired
    ? 'Check je mailbox'
    : 'Welkom bij Groene Vingers';

  const subtitleText = emailVerificationRequired
    ? 'Je account is aangemaakt. Bevestig je e-mailadres via de link in je mailbox en log daarna in.'
    : 'Je profiel is compleet. Je kunt nu meteen aan de slag.';

  const helperText = emailVerificationRequired
    ? 'Na het bevestigen word je naar het inlogscherm geleid.'
    : 'Je kan je profiel later altijd aanpassen.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={logo}
            style={styles.logo}
            accessibilityLabel="Groene Vingers logo"
          />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {titleText}
        </Text>

        <Text style={styles.subtitle}>{subtitleText}</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        {emailVerificationRequired ? (
          <AuthButton
            label="Ga naar inloggen"
            onPress={handleManualCheck}
            variant="primary"
          />
        ) : (
          <AuthButton label="Start" onPress={onConfirmed} variant="primary" />
        )}

        {emailVerificationRequired && email ? (
          <Text style={styles.emailHint}>
            {'Bevestigingsmail verstuurd naar '}
            <Text style={styles.emailHintBold}>{email}</Text>
          </Text>
        ) : null}

        <Text style={styles.helperText}>{helperText}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.screenX,
  },
  logoWrap: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
  },
  emailHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  emailHintBold: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  helperText: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
