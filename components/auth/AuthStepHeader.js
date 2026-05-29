import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'phosphor-react-native';
import { COLORS, FONTS } from '../theme/tokens';

export default function AuthStepHeader({
  onBack,
  onSkip,
  skipLabel = 'Overslaan',
  backLabel = 'Terug',
  backAccessibilityLabel,
  skipDisabled = false,
}) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.back}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel ?? backLabel}
        hitSlop={16}
      >
        <ArrowLeft size={20} color={COLORS.textPrimary} weight="regular" />
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>

      {onSkip ? (
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
          hitSlop={16}
          disabled={skipDisabled}
          style={skipDisabled ? styles.skipDisabled : null}
        >
          <Text style={styles.skipText}>{skipLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  skipText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 16,
    color: COLORS.brand,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.brand,
  },
  skipDisabled: {
    opacity: 0.4,
  },
});
