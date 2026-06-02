import { StyleSheet, View } from 'react-native';
import { LeafIcon } from 'phosphor-react-native';
import { COLORS, SHADOWS, SIZES } from '../theme/tokens';

export default function MapMarker({ selected = false, requestStatus = null }) {
  const size = selected ? SIZES.mapPinSelected : SIZES.mapPin;
  const iconSize = selected ? 22 : 16;

  return (
    <View
      style={[
        styles.pin,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.pinSelected,
        requestStatus === 'pending' && !selected && styles.pinPending,
        requestStatus === 'accepted' && !selected && styles.pinAccepted,
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
  pinPending: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  pinAccepted: {
    borderWidth: 2.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.brandMid,
  },
});
