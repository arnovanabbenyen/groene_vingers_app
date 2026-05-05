import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/tokens';

export default function AuthCheckbox({ checked, onToggle, children }) {
  return (
    <Pressable style={styles.row} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <View style={styles.checkboxTick} /> : null}
      </View>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.brand,
    backgroundColor: 'rgba(87,98,56,0.08)',
  },
  checkboxTick: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.brand,
  },
  text: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 12.8,
    lineHeight: 18,
    color: COLORS.indicatorMuted,
  },
});
