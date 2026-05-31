import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function FormField({ label, hint, counter, counterMax, children, style }) {
  const atLimit = counter != null && counterMax != null && counter >= counterMax;

  const hasBottom = hint || (counter != null && counterMax != null);

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hasBottom ? (
        <View style={styles.bottomRow}>
          {hint ? (
            <Text style={styles.hint}>{hint}</Text>
          ) : (
            <View style={styles.spacer} />
          )}
          {counter != null && counterMax != null ? (
            <Text style={[styles.counter, atLimit && styles.counterAtLimit]}>
              {counter}/{counterMax}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  counter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  counterAtLimit: {
    color: COLORS.negative,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
