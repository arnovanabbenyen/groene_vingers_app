import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRightIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function SettingsRow({
  label,
  sublabel,
  onPress,
  badge,
  badgeBg = COLORS.surfaceBrand,
  badgeColor = COLORS.brand,
  destructive = false,
  showCaret = true,
  rightElement,
  disabled = false,
}) {
  const labelColor = destructive ? COLORS.negative : disabled ? COLORS.textMuted : COLORS.textPrimary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !disabled && styles.rowPressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
    >
      <View style={styles.left}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <View style={styles.right}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        ) : null}
        {rightElement ?? (showCaret ? (
          <CaretRightIcon
            size={18}
            color={destructive ? COLORS.negative : COLORS.textMuted}
            weight="regular"
            accessibilityElementsHidden
          />
        ) : null)}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  rowPressed: {
    backgroundColor: COLORS.background,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  sublabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  badge: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
  },
});
