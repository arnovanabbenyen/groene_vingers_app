import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRightIcon, MapTrifoldIcon } from 'phosphor-react-native';
import { COLORS, FONT_SIZES, FONTS, RADIUS, SPACING } from '../theme/tokens';

export default function HomeSectionCta({ onPress }) {
  return (
    <Pressable
    style={styles.card}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Bekijk tuinen op de kaart"
    accessibilityHint="Gefilterd op jouw locatie en voorkeuren"
  >
      <View style={styles.iconWrap}>
        <MapTrifoldIcon size={24} color={COLORS.textInverse} weight="regular" />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>Bekijk percelen op de kaart</Text>
        <Text style={styles.subtitle}>Gefilterd op jouw locatie en voorkeuren</Text>
      </View>

      <CaretRightIcon size={20} color={COLORS.textInverse} weight="regular" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 80,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.brandSoft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  subtitle: {
    color: COLORS.textInverse,
    fontSize: 13, // intentional: distinct from FONT_SIZES.sm (12.8) per design
    fontFamily: FONTS.body,
    marginTop: SPACING.xxs,
  },
});
