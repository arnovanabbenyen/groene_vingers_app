import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlusCircle } from 'phosphor-react-native';
import { COLORS } from '../theme/tokens';

export default function PhotoPickerCircle({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voeg een foto toe"
      style={styles.button}
    >
      <View style={styles.inner}>
        <PlusCircle size={52} color={COLORS.textPrimary} weight="regular" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    height: 147,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
