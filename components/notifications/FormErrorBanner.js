import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { FONTS, RADIUS } from '../theme/tokens';

const BANNER = {
  background: '#FBEAEA',
  border:     '#E53935',
  icon:       '#E53935',
  text:       '#B12525',
};

export default function FormErrorBanner({ message }) {
  if (!message) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <WarningCircle size={18} color={BANNER.icon} weight="regular" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BANNER.background,
    borderColor: BANNER.border,
    borderWidth: 1,
    borderRadius: RADIUS.xs,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: BANNER.text,
    lineHeight: 18,
  },
});
