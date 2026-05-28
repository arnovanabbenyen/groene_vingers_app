import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme/tokens';
import AuthButton from '../buttons/AuthButton';

export default function OnboardingLayout({
  title,
  subtitle,
  illustration,
  onContinue,
  onSkip,
  step = 1,
  total = 3,
  ctaLabel = 'Volgende',
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Skip button — sits just below status bar */}
      <View style={styles.skipRow}>
        <Pressable onPress={onSkip} hitSlop={8} accessibilityRole="button">
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

      {/* Illustration fills the upper portion of the screen */}
      <View style={styles.illustrationArea}>
        {illustration}
      </View>

      {/* Lower section: progress + text + button */}
      <View style={[styles.lowerSection, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
        <View style={styles.progressRow}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i + 1 === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.buttonWrap}>
          <AuthButton label={ctaLabel} onPress={onContinue} variant="primary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  skipText: {
    fontFamily: FONTS.displayMedium,
    color: COLORS.brand,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowerSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
    marginBottom: SPACING.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  dotActive: { width: 24, backgroundColor: COLORS.brand },
  dotInactive: { backgroundColor: COLORS.indicatorMuted },
  title: {
    fontSize: 25,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  buttonWrap: {
    width: '100%',
    marginTop: SPACING.lg,
  },
});
