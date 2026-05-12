import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function AuthTextField({
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
}) {
  return (
    <View style={[styles.fieldWrap, halfWidth && styles.fieldHalf]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputShellError]}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          placeholderTextColor={COLORS.border}
        />
      </View>
    </View>
  );
}

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
  inputShellError: {
    borderColor: COLORS.negative,
    backgroundColor: COLORS.negativeSoft,
  },
  iconWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
});
