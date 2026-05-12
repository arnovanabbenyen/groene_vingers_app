import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function AuthTextArea({ label, value, onChangeText, placeholder, height = 216 }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, { height }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline
          textAlignVertical="top"
          style={styles.input}
          placeholderTextColor={COLORS.indicatorMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    width: '100%',
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputShell: {
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(87,98,56,0.05)',
    padding: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
    padding: 0,
  },
});
