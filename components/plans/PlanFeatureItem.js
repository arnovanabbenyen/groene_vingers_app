import { StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon, XCircleIcon } from 'phosphor-react-native';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function PlanFeatureItem({ label, included = true }) {
  return (
    <View style={styles.row}>
      {included ? (
        <CheckCircleIcon size={26} color={COLORS.brand} weight="regular" />
      ) : (
        <XCircleIcon size={26} color={COLORS.border} weight="regular" />
      )}
      <Text style={[styles.label, !included && styles.labelMuted]}>{label}</Text>
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
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  labelMuted: {
    color: COLORS.textMuted,
  },
});
