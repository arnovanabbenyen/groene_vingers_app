import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <Pressable onPress={onSkip} hitSlop={8} accessibilityRole="button">
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

      <View style={styles.illustrationWrap}>{illustration}</View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

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

      <View style={styles.ctaRow}>
        <AuthButton label={ctaLabel} onPress={onContinue} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.lg,
  },
  skipRow: {
    position: 'absolute',
    right: SPACING.screenX,
    top: SPACING.lg,
    zIndex: 10,
  },
  skipText: {
    fontFamily: FONTS.displayMedium,
    color: COLORS.brand,
    fontSize: 16,
  },
  illustrationWrap: {
    marginTop: 80,
    width: 226,
    height: 226,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: SPACING.lg,
    fontSize: 25,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: SPACING.sm,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 360,
  },
  progressRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  dotActive: { width: 24, backgroundColor: COLORS.brand },
  dotInactive: { backgroundColor: COLORS.indicatorMuted },
  ctaRow: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.screenX,
    right: SPACING.screenX,
  },
});
