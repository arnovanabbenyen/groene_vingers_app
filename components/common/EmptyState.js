import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function EmptyState({
  icon: Icon,
  iconSize = 52,
  iconColor = COLORS.brand,
  iconBgColor = COLORS.surfaceBrand,
  iconWeight = 'regular',
  title,
  body,
  cta,
}) {
  return (
    <View style={styles.container} accessible accessibilityRole="text">
      {Icon && (
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          <Icon
            size={iconSize}
            color={iconColor}
            weight={iconWeight}
            accessibilityElementsHidden
          />
        </View>
      )}

      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {body ? (
          <Text style={styles.body}>{body}</Text>
        ) : null}
      </View>

      {cta ? (
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          onPress={cta.onPress}
          accessibilityRole="button"
          accessibilityLabel={cta.accessibilityLabel ?? cta.label}
          accessibilityHint={cta.hint}
        >
          <Text style={styles.ctaLabel}>{cta.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    ...SHADOWS.card,
  },
  ctaBtnPressed: { opacity: 0.85 },
  ctaLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
