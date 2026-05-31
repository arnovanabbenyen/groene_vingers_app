import { StyleSheet, View } from 'react-native';
import { LeafIcon } from 'phosphor-react-native';
import { COLORS, SHADOWS, SIZES } from '../theme/tokens';

export default function MapMarker({ selected = false }) {
  const size = selected ? SIZES.mapPinSelected : SIZES.mapPin;
  const iconSize = selected ? 22 : 16;

  return (
    <View
      style={[
        styles.pin,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.pinSelected,
      ]}
    >
      <LeafIcon size={iconSize} color={COLORS.textInverse} weight="fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  pinSelected: {
    backgroundColor: COLORS.brandMid,
  },
});
