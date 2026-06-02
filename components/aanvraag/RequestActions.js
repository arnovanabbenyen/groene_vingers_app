import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function RequestActions({
  onPrimary,
  onSecondary,
  primaryLabel = 'Accepteer',
  secondaryLabel = 'Bekijk',
  primaryLoading = false,
  secondaryLoading = false,
  primaryAccessibilityLabel,
  secondaryAccessibilityLabel,
  style,
}) {
  return (
    <View style={[styles.row, style]}>
      <Pressable
        style={[styles.button, styles.primary]}
        onPress={onPrimary}
        disabled={primaryLoading}
        accessibilityRole="button"
        accessibilityLabel={primaryAccessibilityLabel ?? primaryLabel}
        accessibilityState={{ busy: primaryLoading }}
      >
        {primaryLoading ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.primaryLabel}>{primaryLabel}</Text>}
      </Pressable>

      <Pressable
        style={[styles.button, styles.secondary]}
        onPress={onSecondary}
        disabled={secondaryLoading}
        accessibilityRole="button"
        accessibilityLabel={secondaryAccessibilityLabel ?? secondaryLabel}
        accessibilityState={{ busy: secondaryLoading }}
      >
        {secondaryLoading ? <ActivityIndicator color={COLORS.brand} /> : <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: COLORS.brand,
  },
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },
  primaryLabel: {
    color: COLORS.surface,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  secondaryLabel: {
    color: COLORS.brand,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
});
