import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { XCircleIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

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
    gap: 8,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  containerMulti: {
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    lineHeight: 18,
    color: COLORS.negative,
  },
});
