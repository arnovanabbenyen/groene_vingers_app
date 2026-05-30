import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

const POLL_MS = 5000;
const logo = require('../../assets/logo.png');

export default function WelcomeScreen({
  email,
  emailVerificationRequired = false,
  onConfirmed,
  onGoToLogin,
}) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('waiting'); // waiting | checking | not_confirmed | confirmed
  const [feedback, setFeedback] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const confirm = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus('confirmed');
    setTimeout(() => {
      if (mountedRef.current) onConfirmed?.();
    }, 800);
  }, [onConfirmed]);

  // Realtime: fires when deep link brings the user back after clicking the email link
  useEffect(() => {
    if (!supabase || !emailVerificationRequired) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) confirm();
    });
    return () => subscription?.unsubscribe();
  }, [emailVerificationRequired, confirm]);

  // Polling: backup check every 5 s (e.g. confirmed on another device)
  useEffect(() => {
    if (!supabase || !emailVerificationRequired) return;
    const timer = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at && mountedRef.current) confirm();
      } catch { /* silent — polling is a backup */ }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [emailVerificationRequired, confirm]);

  async function handleManualCheck() {
    if (!supabase || status === 'checking' || status === 'confirmed') return;
    setStatus('checking');
    setFeedback(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (!session) {
        setStatus('not_confirmed');
        setFeedback('Heb je de link in je mailbox geopend? Dan kan je nu inloggen met je gegevens.');
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mountedRef.current) return;
      if (error) {
        setStatus('not_confirmed');
        setFeedback('Kon de status niet controleren. Probeer opnieuw.');
        return;
      }
      if (user?.email_confirmed_at) {
        confirm();
      } else {
        setStatus('not_confirmed');
        setFeedback('Nog niet bevestigd. Heb je de mail al geopend? Wacht even of probeer opnieuw.');
      }
    } catch {
      if (mountedRef.current) {
        setStatus('not_confirmed');
        setFeedback('Er ging iets mis. Probeer opnieuw.');
      }
    }
  }

  const isChecking = status === 'checking';
  const isConfirmed = status === 'confirmed';

  const titleText = emailVerificationRequired
    ? (isConfirmed ? 'Bevestigd!' : 'Check je mailbox')
    : 'Welkom bij Groene Vingers';

  const subtitleText = emailVerificationRequired
    ? (isConfirmed
      ? 'Je account is geactiveerd. Even laden…'
      : 'Je account is aangemaakt. Bevestig je e-mailadres via de link in je mailbox om verder te gaan.')
    : 'Je profiel is compleet. Je kunt nu meteen aan de slag.';

  const helperText = emailVerificationRequired
    ? 'Na verificatie word je automatisch ingelogd.'
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
          {emailVerificationRequired && isConfirmed ? (
            <View style={styles.badge} accessible={false}>
              <CheckCircle size={28} color={COLORS.brand} weight="fill" />
            </View>
          ) : null}
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {titleText}
        </Text>

        <Text style={styles.subtitle}>{subtitleText}</Text>

        {feedback ? (
          <Text
            style={styles.feedback}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {feedback}
          </Text>
        ) : null}

        {isChecking ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.checkingText}>Even kijken…</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        {emailVerificationRequired ? (
          <>
            <AuthButton
              label={isConfirmed ? 'Bevestigd' : 'Ik heb mijn e-mail bevestigd'}
              onPress={handleManualCheck}
              variant="primary"
              loading={isChecking}
              disabled={isChecking || isConfirmed}
            />
            {status === 'not_confirmed' && onGoToLogin ? (
              <AuthButton
                label="Ga naar inloggen"
                onPress={onGoToLogin}
                variant="secondary"
              />
            ) : null}
          </>
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
    width: 120,
    height: 120,
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 1,
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
  feedback: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.negative,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  checkingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
