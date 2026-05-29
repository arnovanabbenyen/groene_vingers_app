import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnvelopeSimple } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../../components/theme/tokens';
import AuthButton from '../../components/buttons/AuthButton';

export default function PasswordResetSentScreen({ email, onBack, onResend }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap} accessible={false}>
          <EnvelopeSimple size={48} color={COLORS.brand} weight="duotone" />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          E-mail verstuurd!
        </Text>
        <Text style={styles.message}>
          {'We hebben een resetlink gestuurd naar '}
          <Text style={styles.emailBold}>{email}</Text>
          {'. Controleer ook je spammap.'}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        <AuthButton label="Terug naar login" variant="primary" onPress={onBack} />
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Geen e-mail ontvangen? </Text>
          <Pressable
            onPress={onResend}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Opnieuw versturen"
          >
            <Text style={styles.resendLink}>Opnieuw versturen</Text>
          </Pressable>
        </View>
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
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceBrand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailBold: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.md,
  },
  resendRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  resendLink: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
});
