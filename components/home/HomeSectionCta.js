import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRightIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/CaretRight.js';
import { MapTrifoldIcon } from '../../node_modules/phosphor-react-native/lib/commonjs/icons/MapTrifold.js';
import { COLORS, FONTS, RADIUS } from '../theme/tokens';

export default function HomeSectionCta() {
  return (
    <Pressable style={styles.card}>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  subtitle: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
});
