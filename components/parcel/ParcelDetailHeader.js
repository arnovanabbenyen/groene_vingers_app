import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeftIcon, DotsThreeIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../theme/tokens';

export default function ParcelDetailHeader({ title = 'Perceel', onBack, onMorePress }) {
  const insets = useSafeAreaInsets();
  const topOffset = Math.max(0, insets.top - 16);

  return (
    <View style={styles.header}>
      <Pressable
        style={[styles.backButton, { top: 55 + topOffset }]}
        onPress={onBack}
        hitSlop={8}
      >
        <ArrowLeftIcon size={24} color={COLORS.textInverse} weight="regular" />
        <Text style={styles.backText}>Terug</Text>
      </Pressable>

      <Text style={[styles.title, { top: 52 + topOffset }]}>{title}</Text>

      <Pressable
        style={[styles.moreButton, { top: 55 + topOffset }]}
        onPress={onMorePress}
        hitSlop={8}
      >
        <DotsThreeIcon size={24} color={COLORS.textInverse} weight="regular" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 160,
    backgroundColor: COLORS.brand,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: SPACING.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    color: COLORS.textInverse,
    fontSize: 16,
    lineHeight: 16,
    fontFamily: FONTS.displayMedium,
    fontWeight: '500',
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: COLORS.textInverse,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: FONTS.displaySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreButton: {
    position: 'absolute',
    right: SPACING.screenX,
  },
});
