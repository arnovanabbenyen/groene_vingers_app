import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';
import AuthButton from '../buttons/AuthButton';

export default function OnboardingLayout({
  title,
  subtitle,
  illustration,
  onContinue,
  onSkip,
  onBack,
  step = 1,
  total = 3,
  ctaLabel = 'Volgende',
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header row — back button left (slides 2+), skip right (always) */}
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Vorige stap"
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={COLORS.brand} weight="regular" />
            <Text style={styles.backText}>Vorige</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Pressable
          onPress={onSkip}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Overslaan, ga naar rolkeuze"
        >
          <Text style={styles.skipText}>Overslaan</Text>
        </Pressable>
      </View>

      {/* Illustration fills the upper portion, circle centered inside */}
      <View style={styles.illustrationArea}>
        {illustration}
      </View>

      {/* Text block — title + subtitle first, then progress dots */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View
          style={styles.progressRow}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel={`Stap ${step} van ${total}`}
          accessibilityValue={{ min: 1, max: total, now: step }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              accessible={false}
              style={[
                styles.progressDot,
                i + 1 === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Flex spacer — pushes button away from text toward the bottom */}
      <View style={styles.spacer} />

      {/* Button pinned at the bottom */}
      <View style={[styles.buttonWrap, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <AuthButton label={ctaLabel} onPress={onContinue} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenX,
    paddingVertical: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    color: COLORS.brand,
    fontSize: 16,
  },
  headerSpacer: {
    width: 70,
  },
  skipText: {
    fontFamily: FONTS.displayMedium,
    color: COLORS.brand,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  // Takes the upper portion; circle centers itself inside
  illustrationArea: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Text content sits between the circle and the button
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: SPACING.screenX,
    gap: SPACING.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
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
  },
  // Flex spacer: gets ~1/4 of the flexible vertical space
  spacer: {
    flex: 1,
  },
  buttonWrap: {
    paddingHorizontal: SPACING.screenX,
  },
});
