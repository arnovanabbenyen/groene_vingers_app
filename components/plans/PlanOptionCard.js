import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LeafIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Leaf.js';
import { TreeEvergreenIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/TreeEvergreen.js';
import PlanFeatureItem from './PlanFeatureItem';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/tokens';

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
}) {
  const isPro = variant === 'pro';

  return (
    <View style={[styles.card, isPro ? styles.cardPro : styles.cardFree]}>
      <View style={styles.iconWrap}>
        {isPro ? (
          <TreeEvergreenIcon size={34} color={COLORS.textPrimary} weight="regular" />
        ) : (
          <LeafIcon size={34} color={COLORS.textPrimary} weight="regular" />
        )}
      </View>

      <Text style={styles.planTitle}>{title}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.priceSuffix}>{priceSuffix}</Text>
      </View>

      {note ? <Text style={styles.note}>{note}</Text> : null}

      <Pressable
        style={[
          styles.button,
          buttonVariant === 'solid' ? styles.buttonSolid : styles.buttonOutline,
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.buttonText,
            buttonVariant === 'solid' ? styles.buttonTextSolid : styles.buttonTextOutline,
          ]}
        >
          {buttonLabel}
        </Text>
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
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 22,
    paddingTop: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPro: {
    height: 407,
  },
  cardFree: {
    height: 433,
  },
  iconWrap: {
    marginTop: 1,
    marginBottom: 1,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: COLORS.textPrimary,
    fontSize: 25,
    lineHeight: 25,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
  },
  priceSuffix: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
    marginLeft: 4,
  },
  note: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
    marginTop: 10,
  },
  button: {
    marginTop: 36,
    height: 53,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSolid: {
    backgroundColor: COLORS.brand,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.surface,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  buttonTextSolid: {
    color: COLORS.textInverse,
  },
  buttonTextOutline: {
    color: COLORS.textPrimary,
  },
  divider: {
    marginTop: 32,
    height: 1,
    backgroundColor: COLORS.dividerSoft,
  },
  sectionLabel: {
    marginTop: 28,
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
  featuresList: {
    marginTop: 17,
    gap: SPACING.md,
  },
});
