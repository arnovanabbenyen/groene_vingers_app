import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function HomePromoCard({ onPressUpgrade }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPressUpgrade}
      accessibilityRole="button"
      accessibilityLabel="Upgrade naar Pro plan"
      accessibilityHint="Onbeperkt aanvragen sturen en meer matches zien"
    >
      <View style={styles.row}>
        <View style={styles.badge}>
          <StarIcon size={22} color={COLORS.accent} weight="fill" />
        </View>

        <View style={styles.textContent}>
          <View style={styles.textGroup}>
            <Text style={styles.title}>Ontgrendel meer matches</Text>
            <Text style={styles.body}>
              Met Pro stuur je onbeperkt aanvragen en zie je wie jouw profiel bekeken heeft.
            </Text>
          </View>

          <View style={styles.buttonWrap}>
            <Text style={styles.buttonText}>Upgrade naar Pro</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brand,
    overflow: 'hidden',
    paddingLeft: 9,
    paddingRight: SPACING.md,
    paddingVertical: 18,
  },
  cardPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brandSoft2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    gap: SPACING.sm,
  },
  textGroup: {
    gap: SPACING.xxs,
  },
  title: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    lineHeight: 22,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  body: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    lineHeight: 19,
  },
  buttonWrap: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    height: 36,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 13,
    fontFamily: FONTS.bodyMedium,
    fontWeight: '500',
  },
});
