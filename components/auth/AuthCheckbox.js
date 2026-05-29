import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Check } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function AuthCheckbox({ checked, onToggle, children, error, accessibilityLabel, accessibilityState }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState ?? { checked }}
        hitSlop={12}
        style={styles.checkboxHit}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked, error && styles.checkboxError]}>
          {checked ? <Check size={11} color={COLORS.brand} weight="bold" /> : null}
        </View>
      </Pressable>
      <Pressable onPress={onToggle} style={styles.labelArea} accessible={false}>
        <Text style={styles.text}>{children}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: SPACING.xs,
  },
  checkboxHit: {
    padding: 2,
  },
  labelArea: {
    flex: 1,
    paddingTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(87,98,56,0.08)',
  },
  checkboxError: {
    borderColor: COLORS.negative,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: 12.8,
    lineHeight: 18,
    color: COLORS.indicatorMuted,
  },
});
