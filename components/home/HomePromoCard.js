import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StarIcon } from 'phosphor-react-native';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

const PROMO_CARD = {
  cardHeight: 137,
  badgeSize: 38,
  badgeRadius: 19,
  buttonHeight: 28,
  badgeLeft: 9,
  badgeTop: 18,
  titleLeft: 65,
  titleTop: 18,
  titleWidth: 263,
  bodyLeft: 65,
  bodyTop: 42,
  bodyWidth: 263,
  buttonLeft: 65,
  buttonTop: 92,
};

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

      <Pressable
        style={styles.button}
        onPress={onPressUpgrade}
        accessibilityRole="button"
        accessibilityLabel="Upgrade naar Pro plan"
        accessibilityHint="Onbeperkt aanvragen sturen en meer matches zien"
      >
        <Text style={styles.buttonText}>Upgrade naar Pro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: PROMO_CARD.cardHeight,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: PROMO_CARD.badgeLeft,
    top: PROMO_CARD.badgeTop,
    width: PROMO_CARD.badgeSize,
    height: PROMO_CARD.badgeSize,
    borderRadius: PROMO_CARD.badgeRadius,
    backgroundColor: COLORS.brandSoft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    left: PROMO_CARD.titleLeft,
    top: PROMO_CARD.titleTop,
    width: PROMO_CARD.titleWidth,
    color: COLORS.accent,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  body: {
    position: 'absolute',
    left: PROMO_CARD.bodyLeft,
    top: PROMO_CARD.bodyTop,
    width: PROMO_CARD.bodyWidth,
    color: COLORS.textInverse,
    fontSize: 12.8,
    fontFamily: FONTS.body,
    lineHeight: 19,
  },
  button: {
    position: 'absolute',
    left: PROMO_CARD.buttonLeft,
    top: PROMO_CARD.buttonTop,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent,
    height: PROMO_CARD.buttonHeight,
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
