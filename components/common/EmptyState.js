import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function EmptyState({
  icon: Icon,
  iconSize,
  iconColor = COLORS.brand,
  iconBgColor = COLORS.surfaceBrand,
  iconWeight = 'regular',
  title,
  body,
  cta,
  ctaPlacement = 'inline',
  compact = false,
  style,
}) {
  const resolvedIconSize = iconSize ?? (compact ? 32 : 52);
  const hasCta = !!cta && !compact;
  const isBottomCta = hasCta && ctaPlacement === 'bottom';

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        isBottomCta && styles.containerBottomCta,
        style,
      ]}
      accessible={!hasCta}
      accessibilityRole={!hasCta ? 'text' : undefined}
    >
      <View style={styles.mainContent}>
        {Icon && (
          <View style={[
            styles.iconCircle,
            compact && styles.iconCircleCompact,
            { backgroundColor: iconBgColor },
          ]}>
            <Icon
              size={resolvedIconSize}
              color={iconColor}
              weight={iconWeight}
              accessibilityElementsHidden
            />
          </View>
        )}

        <View style={styles.textBlock}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          {body ? (
            <Text style={[styles.body, compact && styles.bodyCompact]}>{body}</Text>
          ) : null}
        </View>
      </View>

      {hasCta ? (
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            isBottomCta && styles.ctaBtnBottom,
            pressed && styles.ctaBtnPressed,
          ]}
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
  containerBottomCta: {
    justifyContent: 'center',
  },
  containerCompact: {
    flex: undefined,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  mainContent: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCompact: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  titleCompact: {
    fontSize: FONT_SIZES.lg,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  bodyCompact: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    maxWidth: 240,
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
  ctaBtnBottom: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    bottom: SPACING.xl,
  },
  ctaBtnPressed: { opacity: 0.85 },
  ctaLabel: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textInverse,
  },
});
