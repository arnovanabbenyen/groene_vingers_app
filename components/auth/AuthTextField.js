import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

const FIELD = {
  error: { background: '#FBEAEA' },
};

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

  const resolvedAccessibilityState = {
    ...(accessibilityState || {}),
    invalid: error || accessibilityState?.invalid || undefined,
  };

  return (
    <View style={[styles.fieldWrap, halfWidth && styles.fieldHalf]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          styles.inputShell,
          variant === 'soft' && styles.inputShellSoft,
          error && styles.inputShellError,
          variant === 'soft' && error && styles.inputShellErrorSoft,
          shellStyle,
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
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
              ? <Eye size={18} color={COLORS.border} weight="regular" />
              : <EyeSlash size={18} color={COLORS.border} weight="regular" />
            }
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
    fontSize: 12.8,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputShell: {
    height: 40,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputShellSoft: {
    borderWidth: 0,
    backgroundColor: 'rgba(87,98,56,0.05)',
  },
  inputShellError: {
    borderColor: COLORS.negative,
    backgroundColor: FIELD.error.background,
  },
  inputShellErrorSoft: {
    borderWidth: 1,
    backgroundColor: 'rgba(87,98,56,0.05)',
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
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  inputSoft: {
    fontSize: 16,
  },
});
