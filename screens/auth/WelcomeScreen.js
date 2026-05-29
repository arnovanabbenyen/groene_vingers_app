import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'phosphor-react-native';
import { supabase } from '../../services/supabase';
import { COLORS, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

const POLL_MS = 5000;
const logo = require('../../assets/logo.png');

export default function WelcomeScreen({
  email,
  emailVerificationRequired = false,
  onConfirmed,
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

  // Realtime: react to SIGNED_IN event (fires when deep link establishes session)
  useEffect(() => {
    if (!supabase || !emailVerificationRequired) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          confirm();
        }
      },
    );
    return () => subscription?.unsubscribe();
  }, [emailVerificationRequired, confirm]);

  // Polling: backup check every 5s (catches confirmation from another device/browser)
  useEffect(() => {
    if (!supabase || !emailVerificationRequired) return;
    const timer = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email_confirmed_at && mountedRef.current) confirm();
      } catch {
        // silent — polling is a backup
      }
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
        // No session yet — email link not clicked or deep link didn't open the app
        setStatus('not_confirmed');
        setFeedback('Klik eerst op de link in je mailbox. De app opent dan automatisch.');
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!mountedRef.current) return;
      if (error) {
        setStatus('not_confirmed');
        setFeedback('Kon status niet controleren. Probeer opnieuw.');
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

  // Immediate success — no email verification needed
  if (!emailVerificationRequired) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.logo} />
          </View>
          <Text style={styles.title}>Welkom bij Groene Vingers</Text>
          <Text style={styles.subtitle}>Je profiel is compleet. Je kunt nu meteen aan de slag.</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          <AuthButton label="Start" onPress={onConfirmed} variant="primary" />
          <Text style={styles.helperText}>Je kan je profiel later altijd aanpassen.</Text>
        </View>
      </View>
    );
  }

  // Email verification waiting state
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} />
          {isConfirmed ? (
            <View style={styles.badge}>
              <CheckCircle size={28} color={COLORS.brand} weight="fill" />
            </View>
          ) : null}
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {isConfirmed ? 'Bevestigd!' : 'Check je mailbox'}
        </Text>

        <Text style={styles.subtitle}>
          {isConfirmed
            ? 'Je account is geactiveerd. Even laden…'
            : 'Je account is aangemaakt. Bevestig je e-mailadres via de link in je mailbox om verder te gaan.'}
        </Text>

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
        <AuthButton
          label={isConfirmed ? 'Bevestigd' : 'Ik heb mijn email bevestigd'}
          onPress={handleManualCheck}
          variant="primary"
          loading={isChecking}
          disabled={isChecking || isConfirmed}
        />
        {email ? (
          <Text style={styles.emailHint}>
            {'Bevestigingsmail verstuurd naar\n'}
            <Text style={styles.emailHintBold}>{email}</Text>
          </Text>
        ) : null}
        <Text style={styles.helperText}>Na verificatie word je automatisch ingelogd.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.screenX,
    paddingTop: 118,
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
    marginBottom: 34,
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
    fontSize: 25,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  feedback: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.negative,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  checkingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 16,
  },
  emailHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  emailHintBold: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  helperText: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
