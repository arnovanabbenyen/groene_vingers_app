import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon, TreeIcon } from 'phosphor-react-native';
import PlanFeatureItem from './PlanFeatureItem';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export default function PlanOptionCard({
  variant,
  title,
  price,
  priceSuffix,
  note,
  buttonLabel,
  buttonVariant,
  features,
  onPress,
  isLoading = false,
  disabled = false,
}) {
  const isPro = variant === 'pro';
  const isButtonDisabled = disabled || isLoading;

  return (
    <View
      style={[styles.card, isPro && styles.cardPro]}
      accessibilityRole="none"
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          {isPro ? (
            <TreeIcon size={30} color={COLORS.brand} weight="regular" />
          ) : (
            <LeafIcon size={30} color={COLORS.textSecondary} weight="regular" />
          )}
        </View>
        {isPro && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Aanbevolen</Text>
          </View>
        )}
      </View>

      <Text style={styles.planTitle}>{title}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.priceSuffix}> {priceSuffix}</Text>
      </View>

      {note ? <Text style={styles.note}>{note}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          buttonVariant === 'solid' ? styles.buttonSolid : styles.buttonOutline,
          pressed && !isButtonDisabled && !!onPress && styles.buttonPressed,
          isButtonDisabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={isButtonDisabled}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled: isButtonDisabled || !onPress, busy: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={buttonVariant === 'solid' ? COLORS.textInverse : COLORS.brand}
          />
        ) : (
          <Text
            style={[
              styles.buttonText,
              buttonVariant === 'solid' ? styles.buttonTextSolid : styles.buttonTextOutline,
            ]}
          >
            {buttonLabel}
          </Text>
        )}
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Inbegrepen</Text>

      <View style={styles.featuresList}>
        {features.map((feature) => (
          <PlanFeatureItem
            key={feature.label}
            label={feature.label}
            included={feature.included}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  cardPro: {
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  iconWrap: {},
  badge: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.xxs,
    lineHeight: 14,
    fontFamily: FONTS.bodyMedium,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    fontFamily: FONTS.displaySemiBold,
  },
  priceRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 30,
    fontFamily: FONTS.displaySemiBold,
  },
  priceSuffix: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    fontFamily: FONTS.body,
    marginLeft: SPACING.xs,
  },
  note: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    fontFamily: FONTS.body,
    marginTop: SPACING.sm,
  },
  button: {
    marginTop: SPACING.xl,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSolid: {
    backgroundColor: COLORS.brand,
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
  },
  buttonTextSolid: {
    color: COLORS.textInverse,
  },
  buttonTextOutline: {
    color: COLORS.brand,
  },
  divider: {
    marginTop: SPACING.xl,
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
  sectionLabel: {
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  featuresList: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
});
