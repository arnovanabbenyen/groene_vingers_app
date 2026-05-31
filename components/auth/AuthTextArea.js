import React, { useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const ERROR_BG = '#FBEAEA';

const AuthTextArea = React.forwardRef(function AuthTextArea(
  {
    label,
    value,
    onChangeText,
    placeholder,
    height = 160,
    maxLength,
    autoCapitalize = 'sentences',
    editable = true,
    error = false,
    onBlur,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    shellStyle,
    inputStyle,
    labelStyle,
  },
  ref,
) {
  const handleChange = useCallback(
    (text) => {
      if (!onChangeText) return;
      if (text.length > 0) {
        const upper = text[0].toUpperCase();
        if (upper !== text[0]) {
          onChangeText(upper + text.slice(1));
          return;
        }
      }
      onChangeText(text);
    },
    [onChangeText],
  );

  const resolvedAccessibilityState = {
    ...(accessibilityState || {}),
    invalid: error || accessibilityState?.invalid || undefined,
  };

  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View
        style={[
          styles.inputShell,
          error && styles.inputShellError,
          !editable && styles.inputShellDisabled,
          { height },
          shellStyle,
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          multiline
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect
          spellCheck
          textAlignVertical="top"
          style={[styles.input, inputStyle]}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={resolvedAccessibilityState}
        />
      </View>
      {maxLength ? (
        <Text style={[styles.counter, error && styles.counterError]}>
          {value?.length ?? 0}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
});

export default AuthTextArea;

const styles = StyleSheet.create({
  fieldWrap: {
    width: '100%',
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputShell: {
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputShellError: {
    borderColor: COLORS.negative,
    backgroundColor: ERROR_BG,
  },
  inputShellDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.textPrimary,
    padding: 0,
  },
  counter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xxs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  counterError: {
    color: COLORS.negative,
  },
});
