import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const ERROR_BG = '#FBEAEA';

const AuthTextField = React.forwardRef(function AuthTextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
    halfWidth = false,
    error = false,
    onFocus,
    onBlur,
    autoComplete,
    textContentType,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit,
    maxLength,
    variant = 'default',
    shellStyle,
    inputStyle,
    labelStyle,
  },
  ref,
) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const resolvedAccessibilityState = {
    ...(accessibilityState || {}),
    invalid: error || accessibilityState?.invalid || undefined,
  };

  return (
    <View style={[styles.fieldWrap, halfWidth && styles.fieldHalf]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          styles.shell,
          variant === 'soft' && styles.shellSoft,
          isFocused && styles.shellFocused,
          error && styles.shellError,
          variant === 'soft' && error && styles.shellErrorSoft,
          shellStyle,
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry && !passwordVisible}
          style={[styles.input, variant === 'soft' && styles.inputSoft, inputStyle]}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={resolvedAccessibilityState}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          maxLength={maxLength}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
            style={styles.toggleWrap}
          >
            {passwordVisible
              ? <Eye size={18} color={COLORS.textMuted} weight="regular" />
              : <EyeSlash size={18} color={COLORS.textMuted} weight="regular" />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

export default AuthTextField;

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 14,
  },
  fieldHalf: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  shell: {
    height: 44,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shellSoft: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  shellFocused: {
    borderColor: COLORS.brand,
  },
  shellError: {
    borderColor: COLORS.negative,
    backgroundColor: ERROR_BG,
  },
  shellErrorSoft: {
    backgroundColor: COLORS.surface,
  },
  iconWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  inputSoft: {
    fontSize: FONT_SIZES.md,
  },
});
