import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <WarningCircle size={20} color={COLORS.negative} weight="fill" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.negativeSoft,
    borderRadius: RADIUS.xs,
    marginBottom: SPACING.md,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.negative,
    flex: 1,
    lineHeight: 20,
  },
});
