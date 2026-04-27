import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StarIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/Star.js';
import { COLORS, FONTS, LAYOUT, RADIUS, SIZES } from '../theme/tokens';

export default function HomePromoCard({ onPressUpgrade }) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <StarIcon size={22} color={COLORS.accent} weight="regular" />
      </View>

      <Text style={styles.title}>Ontgrendel meer matches</Text>
      <Text style={styles.body}>
        Met Pro stuur je onbeperkt aanvragen en zie je wie jouw profiel bekeken heeft.
      </Text>

      <Pressable style={styles.button} onPress={onPressUpgrade}>
        <Text style={styles.buttonText}>Upgrade naar Pro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: SIZES.promoCardHeight,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: LAYOUT.promo.badgeLeft,
    top: LAYOUT.promo.badgeTop,
    width: SIZES.promoBadgeSize,
    height: SIZES.promoBadgeSize,
    borderRadius: SIZES.promoBadgeRadius,
    backgroundColor: COLORS.brandSoft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    left: LAYOUT.promo.titleLeft,
    top: LAYOUT.promo.titleTop,
    width: LAYOUT.promo.titleWidth,
    color: COLORS.accent,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  body: {
    position: 'absolute',
    left: LAYOUT.promo.bodyLeft,
    top: LAYOUT.promo.bodyTop,
    width: LAYOUT.promo.bodyWidth,
    color: COLORS.textInverse,
    fontSize: 12.8,
    fontFamily: FONTS.body,
    lineHeight: 19,
  },
  button: {
    position: 'absolute',
    left: LAYOUT.promo.buttonLeft,
    top: LAYOUT.promo.buttonTop,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    height: SIZES.promoButtonHeight,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 12.8,
    lineHeight: 13,
    fontFamily: FONTS.body,
    fontWeight: '400',
  },
});
