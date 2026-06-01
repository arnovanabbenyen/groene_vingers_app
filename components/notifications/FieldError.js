import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { XCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function FieldError({ message }) {
  if (!message) return null;
  const multiLine = String(message).includes('\n');

  return (
    <View
      style={[styles.container, multiLine && styles.containerMulti]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <XCircleIcon size={16} color={COLORS.negative} accessibilityLabel="fout" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  containerMulti: {
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.negative,
  },
});
