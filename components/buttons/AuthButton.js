import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme/tokens';

export default function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  ...rest
}) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && (isPrimary ? styles.buttonPrimaryPressed : styles.buttonSecondaryPressed),
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isPrimary ? COLORS.textInverse : COLORS.brand}
            style={styles.spinner}
          />
        ) : null}
        <Text style={isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: -2,
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
