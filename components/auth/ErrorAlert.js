import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';

export default function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <WarningCircle size={24} color={COLORS.negative} weight="fill" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.negativeSoft,
    borderRadius: RADIUS.xs,
    marginBottom: 16,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.negative,
    flex: 1,
  },
});
