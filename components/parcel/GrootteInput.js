import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const GrootteInput = React.forwardRef(function GrootteInput(
  {
    value,
    onChangeText,
    placeholder = 'Bijvoorbeeld 40...',
    accessibilityLabel = 'Grootte van het perceel in vierkante meter',
  },
  ref,
) {
  const innerRef = useRef(null);
  const resolvedRef = ref ?? innerRef;

  return (
    <View style={styles.shell}>
      <TextInput
        ref={resolvedRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType="number-pad"
        returnKeyType="done"
        style={styles.input}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Voer de oppervlakte in vierkante meter in"
      />
      <Pressable
        style={styles.unitTap}
        onPress={() => resolvedRef.current?.focus?.()}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.unitText}>m²</Text>
      </Pressable>
    </View>
  );
});

export default GrootteInput;

const styles = StyleSheet.create({
  shell: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingLeft: SPACING.md,
    paddingRight: 52,
    position: 'relative',
    marginTop: SPACING.xs,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  unitTap: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
});
