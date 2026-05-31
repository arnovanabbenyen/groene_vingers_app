import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircleIcon } from 'phosphor-react-native';
import Header from '../../components/navigation/Header';
import AuthButton from '../../components/buttons/AuthButton';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SHADOWS, SPACING } from '../../components/theme/tokens';

const FEATURES = [
  'Percelen bekijken & zoeken',
  'Matchen met tuineigenaar',
  'Logboek bijhouden',
];

const PRICE_ROWS = [
  { label: 'Maandelijks abonnement', value: '€5,79', large: false },
  { label: 'BTW (21%)', value: '€1,22', large: false },
  { label: 'Vandaag te betalen', value: '€7,01', large: true },
];

export default function ProPlanConfirmScreen({ onBack, onConfirm, isLoading = false }) {
  return (
    <View style={styles.screen}>
      <Header title="Pro plan" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pro plan</Text>

          <Text style={styles.sectionLabel}>Belangrijke functies</Text>

          <View style={styles.featuresList}>
            {FEATURES.map((feature) => (
              <View
                key={feature}
                style={styles.featureRow}
                accessibilityRole="text"
                accessibilityLabel={`${feature}: inbegrepen`}
              >
                <CheckCircleIcon size={22} color={COLORS.brand} weight="fill" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRows}>
            {PRICE_ROWS.map((row, index) => (
              <View key={row.label} style={[styles.priceRow, index === PRICE_ROWS.length - 1 && styles.priceRowTotal]}>
                <Text style={[styles.priceLabel, row.large && styles.priceLabelLarge]}>
                  {row.label}
                </Text>
                <Text style={[styles.priceValue, row.large && styles.priceValueLarge]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          <AuthButton
            label="Abonneren"
            onPress={onConfirm}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        <Text style={styles.disclaimer}>
          Wordt verlengd maandelijks totdat je opzegt. Er wordt €7,01/maand (incl. btw) bij je in rekening gebracht.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 30,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  featuresList: {
    gap: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontFamily: FONTS.displayMedium,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerSoft,
    marginVertical: SPACING.lg,
  },
  priceRows: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRowTotal: {
    marginTop: SPACING.xs,
  },
  priceLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  priceValue: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  priceLabelLarge: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
  },
  priceValueLarge: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
  },
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
