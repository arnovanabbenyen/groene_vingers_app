import { Pressable, StyleSheet, Text, View } from 'react-native';
import PlanFeatureItem from './PlanFeatureItem';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

const PRO_FEATURES = [
  'Percelen bekijken & zoeken',
  'Matchen met tuineigenaar',
  'Logboek bijhouden',
];

export default function UpgradeCard({ onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.priceBlock}>
        <Text style={styles.planLabel}>Pro</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>€7,01</Text>
          <Text style={styles.priceSuffix}>/maand</Text>
        </View>
        <Text style={styles.note}>Inclusief €1,22 btw</Text>
      </View>

      <View style={styles.features}>
        {PRO_FEATURES.map((feature) => (
          <PlanFeatureItem key={feature} label={feature} included inverse />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Upgrade naar Pro plan"
        accessibilityHint="Opent de betaalpagina voor het Pro plan"
      >
        <Text style={styles.buttonText}>Upgrade naar Pro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  priceBlock: {
    gap: SPACING.xxs,
  },
  planLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xxs,
  },
  price: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.textInverse,
    lineHeight: 32,
  },
  priceSuffix: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
    opacity: 0.7,
  },
  note: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textInverse,
    opacity: 0.55,
  },
  features: {
    gap: SPACING.md,
  },
  button: {
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
});
