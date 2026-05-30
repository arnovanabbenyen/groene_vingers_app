import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function HomePromoCard({ onPressUpgrade }) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPressUpgrade}
      accessibilityRole="button"
      accessibilityLabel="Upgrade naar Pro plan"
      accessibilityHint="Onbeperkt aanvragen sturen en meer matches zien"
    >
      <View style={styles.row}>
        <View style={styles.badge}>
          <StarIcon size={22} color={COLORS.accent} weight="regular" />
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
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    overflow: 'hidden',
    paddingLeft: 9,        // matches original badge inset (badgeLeft: 9)
    paddingRight: SPACING.md,
    paddingVertical: 18,   // matches original badge/title top position
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,               // titleLeft(65) - paddingLeft(9) - badgeSize(38) = 18
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
    gap: 12,               // body-bottom to button-top from original layout
  },
  textGroup: {
    gap: SPACING.sm,       // title-bottom to body-top (8px = bodyTop - titleTop - titleLineHeight)
  },
  title: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    lineHeight: 16,
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
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    height: 28,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
});
