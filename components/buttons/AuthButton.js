import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function AuthButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon: Icon,
  ...rest
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isTertiary = variant === 'tertiary';
  const isDisabled = disabled || loading;

  const iconColor = isPrimary || isDanger ? COLORS.textInverse : isTertiary ? COLORS.negative : COLORS.brand;

  function getButtonStyle(pressed) {
    if (isPrimary)  return [styles.buttonPrimary,   pressed && styles.buttonPrimaryPressed];
    if (isDanger)   return [styles.buttonDanger,    pressed && styles.buttonDangerPressed];
    if (isTertiary) return [styles.buttonTertiary,  pressed && styles.buttonTertiaryPressed];
    return [styles.buttonSecondary, pressed && styles.buttonSecondaryPressed];
  }

  const textStyle = isPrimary || isDanger ? styles.buttonTextInverse : isTertiary ? styles.buttonTextNegative : styles.buttonTextBrand;

  return (
    <Pressable
      style={({ pressed }) => [styles.button, ...getButtonStyle(pressed), isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} style={styles.spinner} />
        ) : Icon ? (
          <Icon size={20} color={iconColor} weight="regular" accessibilityElementsHidden />
        ) : null}
        <Text style={textStyle}>{label}</Text>
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
    opacity: 0.85,
  },
  buttonDanger: {
    backgroundColor: COLORS.negative,
  },
  buttonDangerPressed: {
    opacity: 0.85,
  },
  buttonTertiary: {},
  buttonTertiaryPressed: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextInverse: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  buttonTextBrand: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.brand,
    textAlign: 'center',
  },
  buttonTextNegative: {
    fontSize: 16,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.negative,
    textAlign: 'center',
  },
});
