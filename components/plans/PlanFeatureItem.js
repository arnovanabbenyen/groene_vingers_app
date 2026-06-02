import { StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon, XCircleIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, SPACING } from '../theme/tokens';

export default function PlanFeatureItem({ label, included = true, inverse = false }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${included ? 'inbegrepen' : 'niet inbegrepen'}`}
    >
      {included ? (
        <CheckCircleIcon
          size={22}
          color={inverse ? COLORS.accent : COLORS.brand}
          weight="fill"
          accessibilityElementsHidden
        />
      ) : (
        <XCircleIcon
          size={22}
          color={COLORS.indicatorMuted}
          weight="fill"
          accessibilityElementsHidden
        />
      )}
      <Text style={[styles.label, !included && styles.labelMuted, inverse && styles.labelInverse]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
  labelMuted: {
    color: COLORS.textMuted,
  },
  labelInverse: {
    color: COLORS.textInverse,
  },
});
