import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';

export default function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && (isPrimary ? styles.buttonPrimaryPressed : styles.buttonSecondaryPressed),
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonPrimary: {
    backgroundColor: COLORS.brand,
  },

  buttonPrimaryPressed: {
    opacity: 0.85,
  },

  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.brand,
  },

  buttonSecondaryPressed: {
    backgroundColor: COLORS.background,
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonTextPrimary: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    color: COLORS.textInverse,
    textAlign: 'center',
  },

  buttonTextSecondary: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    color: COLORS.brand,
    textAlign: 'center',
  },
});
